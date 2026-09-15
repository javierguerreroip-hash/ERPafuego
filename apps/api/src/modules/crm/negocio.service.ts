import type { Negocio, Prisma, User } from '@prisma/client';
import { ETAPAS_NEGOCIO, type GanarNegocioInput, type NegocioInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularValorDespuesImpuestos } from '../eventos/evento.calculations.js';
import { calcularEficienciaComercial } from './negocio.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type NegocioWithVendedor = Negocio & { vendedor: Pick<User, 'name'> };

function serialize(negocio: NegocioWithVendedor) {
  return {
    id: negocio.id,
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
    createdAt: negocio.createdAt.toISOString(),
    updatedAt: negocio.updatedAt.toISOString(),
  };
}

// Vendedores que se pueden asignar en el CRM: usuarios activos con rol
// Administrador o Ventas — Operación y Cocina/Nómina no venden.
export async function listVendedoresDisponibles() {
  return prisma.user.findMany({
    where: { active: true, role: { in: ['ADMINISTRADOR', 'VENTAS'] } },
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
    include: { vendedor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return negocios.map(serialize);
}

export async function createNegocio(input: NegocioInput) {
  await findVendedorOrThrow(input.vendedorId);
  const negocio = await prisma.negocio.create({
    data: {
      clienteNombre: input.clienteNombre,
      clienteIdentificacion: input.clienteIdentificacion,
      telefono: input.telefono,
      nombreEvento: input.nombreEvento,
      fechaEvento: new Date(input.fechaEvento),
      valorAntesImpuestos: input.valorAntesImpuestos,
      vendedorId: input.vendedorId,
    },
    include: { vendedor: { select: { name: true } } },
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
  const negocio = await prisma.negocio.update({
    where: { id },
    data: {
      clienteNombre: input.clienteNombre,
      clienteIdentificacion: input.clienteIdentificacion,
      telefono: input.telefono,
      nombreEvento: input.nombreEvento,
      fechaEvento: new Date(input.fechaEvento),
      valorAntesImpuestos: input.valorAntesImpuestos,
      vendedorId: input.vendedorId,
    },
    include: { vendedor: { select: { name: true } } },
  });
  return serialize(negocio);
}

export async function perderNegocio(id: string) {
  await findNegocioCotizadoOrThrow(id);
  const negocio = await prisma.negocio.update({
    where: { id },
    data: { etapa: 'PERDIDO' },
    include: { vendedor: { select: { name: true } } },
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

// Busca un Cliente existente por identificación (si se dio y es un dato
// real, no un placeholder tipo "n/a") o por nombre exacto; si no existe
// ninguno, lo crea — evita doble digitación y evita duplicar clientes ya
// registrados en el Módulo 1. Recibe `tx` porque corre dentro de la
// transacción de ganarNegocio.
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

// Al ganar: resuelve/crea el Cliente, crea el Evento del Módulo 3 con los
// campos que sí trae el CRM + los 2 que faltan (opción de menú, número de
// personas — ver decisión documentada en el README), crea el registro en
// la Agenda de Eventos (Fase 11, precargando el vendedor del negocio) y
// vincula el negocio al evento resultante — todo en una sola transacción,
// para no dejar un negocio "ganado" sin su evento/agenda (o registros
// huérfanos) si algo falla a mitad de camino.
export async function ganarNegocio(id: string, input: GanarNegocioInput, registeredById: string) {
  const negocio = await findNegocioCotizadoOrThrow(id);

  const actualizado = await prisma.$transaction(async (tx) => {
    const cliente = await resolverOCrearCliente(tx, {
      clienteNombre: negocio.clienteNombre,
      clienteIdentificacion: negocio.clienteIdentificacion,
      telefono: negocio.telefono,
    });

    const opcionMenu = await tx.opcionMenu.findUnique({ where: { id: input.opcionMenuId } });
    if (!opcionMenu) {
      throw new HttpError(404, 'Opción de menú no encontrada');
    }

    const valorAntesImpuestos = Number(negocio.valorAntesImpuestos);
    let valorDespuesImpuestos = valorAntesImpuestos;
    if (input.taxRateId) {
      const taxRate = await tx.taxRate.findUnique({ where: { id: input.taxRateId } });
      if (!taxRate) {
        throw new HttpError(404, 'Tarifa de impuesto no encontrada');
      }
      valorDespuesImpuestos = calcularValorDespuesImpuestos(valorAntesImpuestos, Number(taxRate.rate));
    }

    const evento = await tx.evento.create({
      data: {
        fecha: negocio.fechaEvento,
        clienteId: cliente.id,
        opcionMenuId: input.opcionMenuId,
        numeroPersonas: input.numeroPersonas,
        valorAntesImpuestos,
        taxRateId: input.taxRateId ?? null,
        valorDespuesImpuestos,
        registeredById,
      },
    });

    await tx.agendaEvento.create({
      data: {
        eventoId: evento.id,
        vendedorId: negocio.vendedorId,
      },
    });

    return tx.negocio.update({
      where: { id },
      data: { etapa: 'GANADO', eventoId: evento.id },
      include: { vendedor: { select: { name: true } } },
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
