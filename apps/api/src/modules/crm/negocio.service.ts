import type { Prisma } from '@prisma/client';
import {
  ETAPAS_NEGOCIO,
  type CotizacionItemInput,
  type GanarNegocioInput,
  type NegocioGanadoUpdateInput,
  type NegocioInput,
} from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularValorDespuesImpuestos } from '../eventos/evento.calculations.js';
import { opcionesOrdenadas } from '../eventos/evento-opciones.js';
import { calcularEficienciaComercial } from './negocio.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const includeRelations = {
  vendedor: { select: { name: true } },
  evento: {
    include: {
      agenda: true,
      opcionMenu: true,
      opciones: { include: { opcionMenu: true }, orderBy: { createdAt: 'asc' as const } },
    },
  },
} satisfies Prisma.NegocioInclude;

type NegocioWithRelations = Prisma.NegocioGetPayload<{ include: typeof includeRelations }>;

function serialize(negocio: NegocioWithRelations) {
  return {
    id: negocio.id,
    clienteId: negocio.clienteId,
    clienteNombre: negocio.clienteNombre,
    clienteIdentificacion: negocio.clienteIdentificacion,
    telefono: negocio.telefono,
    nombreEvento: negocio.nombreEvento,
    fechaEvento: negocio.fechaEvento.toISOString(),
    valorAntesImpuestos: Number(negocio.valorAntesImpuestos),
    etapa: negocio.etapa,
    eventoId: negocio.eventoId,
    vendedorId: negocio.vendedorId,
    vendedorNombre: negocio.vendedor.name,
    numeroPersonas: negocio.evento?.numeroPersonas ?? null,
    opciones: negocio.evento
      ? opcionesOrdenadas(negocio.evento).map((o) => ({
          opcionMenuId: o.opcionMenuId,
          opcionMenuNombre: o.opcionMenu.name,
          numeroPersonas: o.numeroPersonas,
        }))
      : [],
    taxRateId: negocio.evento?.taxRateId ?? null,
    horaServicio: negocio.evento?.agenda?.horaServicio ?? null,
    direccion: negocio.evento?.agenda?.direccion ?? null,
    createdAt: negocio.createdAt.toISOString(),
    updatedAt: negocio.updatedAt.toISOString(),
  };
}

// Vendedores que se pueden asignar en el CRM: usuarios activos con rol
// Administrador o Ventas — Operación y Cocina/Nómina no venden.
export async function listVendedoresDisponibles() {
  return prisma.user.findMany({
    where: {
      active: true,
      OR: [{ role: { in: ['ADMINISTRADOR', 'VENTAS'] } }, { esVendedor: true }],
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function findVendedorOrThrow(vendedorId: string) {
  const vendedor = await prisma.user.findUnique({ where: { id: vendedorId } });
  if (!vendedor || !vendedor.active) {
    throw new HttpError(404, 'Vendedor no encontrado o inactivo');
  }
  return vendedor;
}

// El CRM solo permite seleccionar clientes ya creados en el Módulo 1 —
// no se puede escribir uno nuevo desde aquí (decisión 2026-09-21, evita
// duplicados y errores de digitación como el de identificación "n/a").
async function findClienteOrThrow(clienteId: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || !cliente.active) {
    throw new HttpError(
      404,
      'Cliente no encontrado o inactivo. Créalo primero en el módulo de Clientes.',
    );
  }
  return cliente;
}

// Resumen para la gráfica circular del CRM: valor + cantidad por etapa
// (Cotizado/Ganado/Perdido, filtrados por fechaEvento en el período — el
// mismo criterio de fecha que usa el resto del ERP) y la eficiencia
// comercial (Ganado ÷ total cotizado).
export async function getResumenCrm(start: Date, end: Date) {
  const negocios = await prisma.negocio.findMany({
    where: { fechaEvento: { gte: start, lte: end } },
    select: { etapa: true, valorAntesImpuestos: true },
  });

  const porEtapa = ETAPAS_NEGOCIO.map((etapa) => {
    const deLaEtapa = negocios.filter((n) => n.etapa === etapa);
    return {
      etapa,
      cantidad: deLaEtapa.length,
      valor: round2(deLaEtapa.reduce((sum, n) => sum + Number(n.valorAntesImpuestos), 0)),
    };
  });

  const totalCotizado = round2(porEtapa.reduce((sum, p) => sum + p.valor, 0));
  const totalGanado = porEtapa.find((p) => p.etapa === 'GANADO')?.valor ?? 0;

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    porEtapa,
    totalCotizado,
    totalGanado,
    eficiencia: calcularEficienciaComercial(totalGanado, totalCotizado),
  };
}

export async function listNegocios() {
  const negocios = await prisma.negocio.findMany({
    include: includeRelations,
    orderBy: { createdAt: 'desc' },
  });
  return negocios.map(serialize);
}

export async function createNegocio(input: NegocioInput) {
  await findVendedorOrThrow(input.vendedorId);
  const cliente = await findClienteOrThrow(input.clienteId);
  const negocio = await prisma.negocio.create({
    data: {
      clienteId: cliente.id,
      clienteNombre: cliente.name,
      clienteIdentificacion: cliente.identificacion,
      telefono: cliente.telefono,
      nombreEvento: input.nombreEvento,
      fechaEvento: new Date(input.fechaEvento),
      valorAntesImpuestos: input.valorAntesImpuestos,
      vendedorId: input.vendedorId,
    },
    include: includeRelations,
  });
  return serialize(negocio);
}

async function findNegocioCotizadoOrThrow(id: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id } });
  if (!negocio) {
    throw new HttpError(404, 'Negocio no encontrado');
  }
  if (negocio.etapa !== 'COTIZADO') {
    throw new HttpError(409, 'Solo se pueden editar negocios en etapa "Cotizado"');
  }
  return negocio;
}

export async function updateNegocio(id: string, input: NegocioInput) {
  await findNegocioCotizadoOrThrow(id);
  await findVendedorOrThrow(input.vendedorId);
  const cliente = await findClienteOrThrow(input.clienteId);
  const negocio = await prisma.negocio.update({
    where: { id },
    data: {
      clienteId: cliente.id,
      clienteNombre: cliente.name,
      clienteIdentificacion: cliente.identificacion,
      telefono: cliente.telefono,
      nombreEvento: input.nombreEvento,
      fechaEvento: new Date(input.fechaEvento),
      valorAntesImpuestos: input.valorAntesImpuestos,
      vendedorId: input.vendedorId,
    },
    include: includeRelations,
  });
  return serialize(negocio);
}

export async function perderNegocio(id: string) {
  await findNegocioCotizadoOrThrow(id);
  const negocio = await prisma.negocio.update({
    where: { id },
    data: { etapa: 'PERDIDO' },
    include: includeRelations,
  });
  return serialize(negocio);
}

// Valores que el equipo comercial escribe en "Cédula/NIT" cuando en
// realidad no tienen el dato (no significan "es la misma persona que
// otro cliente con el mismo texto"). Bug real detectado 2026-09-15: dos
// clientes distintos con identificación "n/a" quedaron fusionados en uno
// solo porque el matching los trataba como la misma identificación.
const IDENTIFICACIONES_NO_VALIDAS = new Set([
  '', 'n/a', 'na', 'no aplica', 'no tiene', 'ninguna', 'ninguno', '-', '0',
]);

function esIdentificacionValida(identificacion: string): boolean {
  return !IDENTIFICACIONES_NO_VALIDAS.has(identificacion.trim().toLowerCase());
}

// Respaldo SOLO para negocios creados antes de exigir clienteId
// (2026-09-21): busca un Cliente existente por identificación (si se dio
// y es un dato real, no un placeholder tipo "n/a") o por nombre exacto;
// si no existe ninguno, lo crea. Los negocios nuevos ya traen clienteId
// directo (ver ganarNegocio) y no pasan por aquí. Recibe `tx` porque
// corre dentro de la transacción de ganarNegocio.
async function resolverOCrearCliente(
  tx: Prisma.TransactionClient,
  input: { clienteNombre: string; clienteIdentificacion: string; telefono: string },
) {
  if (esIdentificacionValida(input.clienteIdentificacion)) {
    const porIdentificacion = await tx.cliente.findFirst({
      where: { identificacion: input.clienteIdentificacion },
    });
    if (porIdentificacion) return porIdentificacion;
  }

  const porNombre = await tx.cliente.findFirst({
    where: { name: { equals: input.clienteNombre, mode: 'insensitive' } },
  });
  if (porNombre) return porNombre;

  return tx.cliente.create({
    data: {
      name: input.clienteNombre,
      identificacion: input.clienteIdentificacion,
      telefono: input.telefono,
    },
  });
}

// Datos de la venta que salen de la cotización del negocio (propuesta 001 ·
// entrega 2, 2026-11-23): cada ítem de menú pasa como una opción de la venta
// con la cantidad de su ítem (personas o unidades); si una misma opción está
// en varios ítems, se suman. Las cotizaciones anteriores no traen el
// identificador de la opción: se reconoce por el nombre. Los ítems que no son
// una opción de menú se ignoran. Devuelve null si no se reconoce ninguna.
async function datosDeLaCotizacion(negocioId: string) {
  const cotizacion = await prisma.cotizacion.findUnique({ where: { negocioId } });
  if (!cotizacion) return null;

  const opciones = await prisma.opcionMenu.findMany({ select: { id: true, name: true } });
  const idPorNombre = new Map(opciones.map((o) => [o.name.trim().toLowerCase(), o.id]));
  const idsValidos = new Set(opciones.map((o) => o.id));

  const items = cotizacion.items as unknown as CotizacionItemInput[];
  const cantidadPorOpcion = new Map<string, number>();
  for (const item of items) {
    const id =
      item.opcionMenuId && idsValidos.has(item.opcionMenuId)
        ? item.opcionMenuId
        : idPorNombre.get(item.descripcion.trim().toLowerCase());
    if (!id) continue;
    cantidadPorOpcion.set(id, (cantidadPorOpcion.get(id) ?? 0) + item.cantidad);
  }
  if (cantidadPorOpcion.size === 0) return null;

  return {
    opciones: [...cantidadPorOpcion.entries()].map(([opcionMenuId, cantidad]) => ({
      opcionMenuId,
      numeroPersonas: Math.max(1, Math.round(cantidad)),
    })),
    numeroPersonas: cotizacion.numeroPersonas,
    taxRateId: cotizacion.taxRateId,
    lugar: cotizacion.lugar,
  };
}

// Al ganar: toma el Cliente ya vinculado (clienteId), crea el Evento del
// Módulo 3 con los campos que sí trae el CRM + los 2 que faltan (opción
// de menú, número de personas — ver decisión documentada en el README),
// crea el registro en la Agenda de Eventos (Fase 11, precargando el
// vendedor del negocio) y vincula el negocio al evento resultante — todo
// en una sola transacción, para no dejar un negocio "ganado" sin su
// evento/agenda (o registros huérfanos) si algo falla a mitad de camino.
export async function ganarNegocio(id: string, input: GanarNegocioInput, registeredById: string) {
  const negocio = await findNegocioCotizadoOrThrow(id);

  // Sin preguntar nada: opciones de menú, personas e impuesto salen de la
  // cotización. Los datos del cuerpo de la petición son solo el respaldo para
  // negocios históricos sin cotización reconocible.
  const deCotizacion = await datosDeLaCotizacion(id);
  const lineasOpciones = input.opcionMenuId
    ? [{ opcionMenuId: input.opcionMenuId, numeroPersonas: input.numeroPersonas ?? 1 }]
    : deCotizacion?.opciones;
  if (!lineasOpciones || lineasOpciones.length === 0) {
    throw new HttpError(
      422,
      'Este negocio no tiene una opción de menú reconocible en su cotización: elígela para poder ganarlo.',
    );
  }
  const numeroPersonasEvento = input.numeroPersonas ?? deCotizacion?.numeroPersonas ?? lineasOpciones[0].numeroPersonas;
  const taxRateIdEvento =
    input.taxRateId === undefined ? (deCotizacion?.taxRateId ?? null) : input.taxRateId;

  const actualizado = await prisma.$transaction(async (tx) => {
    // negocio.clienteId puede ser null solo en negocios que ya existían
    // antes de exigir la selección de cliente — para esos, se conserva el
    // comportamiento anterior de buscar/crear por nombre/identificación.
    const cliente = negocio.clienteId
      ? await tx.cliente.findUnique({ where: { id: negocio.clienteId } })
      : await resolverOCrearCliente(tx, {
          clienteNombre: negocio.clienteNombre,
          clienteIdentificacion: negocio.clienteIdentificacion,
          telefono: negocio.telefono,
        });
    if (!cliente) {
      throw new HttpError(404, 'Cliente no encontrado');
    }

    const idsOpciones = lineasOpciones.map((l) => l.opcionMenuId);
    const opcionesExistentes = await tx.opcionMenu.count({ where: { id: { in: idsOpciones } } });
    if (opcionesExistentes !== new Set(idsOpciones).size) {
      throw new HttpError(404, 'Opción de menú no encontrada');
    }

    const valorAntesImpuestos = Number(negocio.valorAntesImpuestos);
    let valorDespuesImpuestos = valorAntesImpuestos;
    if (taxRateIdEvento) {
      const taxRate = await tx.taxRate.findUnique({ where: { id: taxRateIdEvento } });
      if (!taxRate) {
        throw new HttpError(404, 'Tarifa de impuesto no encontrada');
      }
      valorDespuesImpuestos = calcularValorDespuesImpuestos(valorAntesImpuestos, Number(taxRate.rate));
    }

    const evento = await tx.evento.create({
      data: {
        fecha: negocio.fechaEvento,
        clienteId: cliente.id,
        // La primera opción es la principal (Evento.opcionMenuId).
        opcionMenuId: lineasOpciones[0].opcionMenuId,
        opciones: { create: lineasOpciones },
        numeroPersonas: numeroPersonasEvento,
        valorAntesImpuestos,
        taxRateId: taxRateIdEvento,
        valorDespuesImpuestos,
        vendedorId: negocio.vendedorId,
        registeredById,
      },
    });

    await tx.agendaEvento.create({
      data: {
        eventoId: evento.id,
        vendedorId: negocio.vendedorId,
        // La agenda llega casi llena (propuesta 001): contacto y teléfono
        // del cliente y el lugar de la cotización como nota. Solo faltan la
        // hora y la dirección.
        personaContacto: cliente.name,
        telefonoContacto: cliente.telefono,
        observaciones: deCotizacion?.lugar ? `Lugar según la cotización: ${deCotizacion.lugar}` : '',
      },
    });

    return tx.negocio.update({
      where: { id },
      data: { etapa: 'GANADO', eventoId: evento.id },
      include: includeRelations,
    });
  });

  return serialize(actualizado);
}

// Edita un negocio ya "Ganado" — el cliente pide cambios (invitados,
// valor, fecha, hora, dirección) después de aprobar la cotización. A
// diferencia de la edición normal (solo Cotizado), esta actualiza a la
// vez el Negocio, la Venta (Evento del Módulo 3, incluyendo el
// recálculo del valor después de impuestos con la tarifa ya asignada) y
// la Agenda operativa — en una sola transacción, para que ningún módulo
// se quede desactualizado. Cartera, Dashboard y Estado de Resultados no
// necesitan tocarse aparte: leen el valor del Evento en vivo.
export async function updateNegocioGanado(id: string, input: NegocioGanadoUpdateInput) {
  const negocio = await prisma.negocio.findUnique({ where: { id } });
  if (!negocio) {
    throw new HttpError(404, 'Negocio no encontrado');
  }
  if (negocio.etapa !== 'GANADO' || !negocio.eventoId) {
    throw new HttpError(409, 'Solo se puede editar así un negocio ya ganado, con venta asociada');
  }

  const evento = await prisma.evento.findUnique({ where: { id: negocio.eventoId } });
  if (!evento) {
    throw new HttpError(404, 'La venta asociada a este negocio no existe');
  }

  const fechaEvento = new Date(input.fechaEvento);

  // Propuesta 001 · entrega 3: opciones de menú, impuesto y vendedor también
  // se cambian desde aquí (si no vienen, quedan como están).
  if (input.opciones) {
    const ids = input.opciones.map((o) => o.opcionMenuId);
    const existentes = await prisma.opcionMenu.count({ where: { id: { in: ids } } });
    if (existentes !== new Set(ids).size) {
      throw new HttpError(404, 'Opción de menú no encontrada');
    }
  }
  const vendedorNuevo = input.vendedorId ? await findVendedorOrThrow(input.vendedorId) : null;
  const taxRateIdNuevo = input.taxRateId === undefined ? evento.taxRateId : input.taxRateId;

  let valorDespuesImpuestos = input.valorAntesImpuestos;
  if (taxRateIdNuevo) {
    const taxRate = await prisma.taxRate.findUnique({ where: { id: taxRateIdNuevo } });
    if (!taxRate) {
      throw new HttpError(404, 'Tarifa de impuesto no encontrada');
    }
    valorDespuesImpuestos = calcularValorDespuesImpuestos(input.valorAntesImpuestos, Number(taxRate.rate));
  }

  const eventoId = negocio.eventoId;
  const actualizado = await prisma.$transaction(async (tx) => {
    await tx.evento.update({
      where: { id: eventoId },
      data: {
        fecha: fechaEvento,
        numeroPersonas: input.numeroPersonas,
        valorAntesImpuestos: input.valorAntesImpuestos,
        valorDespuesImpuestos,
        taxRateId: taxRateIdNuevo,
        ...(vendedorNuevo ? { vendedorId: vendedorNuevo.id } : {}),
        // La primera opción es la principal (Evento.opcionMenuId).
        ...(input.opciones
          ? {
              opcionMenuId: input.opciones[0].opcionMenuId,
              opciones: { deleteMany: {}, create: input.opciones },
            }
          : {}),
      },
    });

    // updateMany (no update) porque el registro de Agenda pudo haberse
    // borrado por separado desde ese módulo — si no existe, simplemente
    // no hay nada que sincronizar ahí.
    await tx.agendaEvento.updateMany({
      where: { eventoId },
      data: {
        horaServicio: input.horaServicio,
        direccion: input.direccion,
        ...(vendedorNuevo ? { vendedorId: vendedorNuevo.id } : {}),
      },
    });

    return tx.negocio.update({
      where: { id },
      data: {
        fechaEvento,
        valorAntesImpuestos: input.valorAntesImpuestos,
        ...(vendedorNuevo ? { vendedorId: vendedorNuevo.id } : {}),
      },
      include: includeRelations,
    });
  });

  return serialize(actualizado);
}

// Borrado real de un negocio — pedido por el negocio para poder corregir
// errores de digitación en el CRM. Se bloquea si ya está "Ganado": ese
// negocio ya generó una venta (Evento) real, y borrarlo aquí la dejaría
// huérfana. Para corregir un negocio ganado por error, primero se borra
// la venta desde el módulo de Ventas (eso ya regresa el negocio a
// "Cotizado" automáticamente) y luego se puede borrar aquí.
export async function deleteNegocio(id: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id } });
  if (!negocio) {
    throw new HttpError(404, 'Negocio no encontrado');
  }
  if (negocio.etapa === 'GANADO') {
    throw new HttpError(
      409,
      'No se puede eliminar: este negocio ya fue ganado y tiene una venta asociada. Elimina primero la venta desde el módulo de Ventas.',
    );
  }
  await prisma.negocio.delete({ where: { id } });
}
