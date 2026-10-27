import type { Prisma } from '@prisma/client';
import { CATEGORIAS_MONITOREO, type EventoConsumoInput, type EventoInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { costoUnitarioDeArticulo } from '../../lib/costo-unitario.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { nombreOpcionesEvento, opcionesOrdenadas } from './evento-opciones.js';
import {
  calcularCostoPorcentaje,
  calcularCostoTotal,
  calcularSubtotalConsumo,
  calcularUtilidadOperacional,
  calcularValorDespuesImpuestos,
} from './evento.calculations.js';

const includeSummary = {
  cliente: true,
  opcionMenu: true,
  opciones: { include: { opcionMenu: true }, orderBy: { createdAt: 'asc' as const } },
  taxRate: true,
  vendedor: true,
  registeredBy: true,
  consumos: true,
} satisfies Prisma.EventoInclude;

type EventoWithSummary = Prisma.EventoGetPayload<{ include: typeof includeSummary }>;

const includeDetail = {
  ...includeSummary,
  consumos: { include: { articulo: true }, orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.EventoInclude;

type EventoWithDetail = Prisma.EventoGetPayload<{ include: typeof includeDetail }>;

function serializeSummary(evento: EventoWithSummary) {
  const valorAntesImpuestos = Number(evento.valorAntesImpuestos);
  const costoTotal = calcularCostoTotal(
    evento.consumos.map((c) => ({ subtotal: Number(c.subtotal) })),
  );
  const utilidad = calcularUtilidadOperacional(valorAntesImpuestos, costoTotal);

  return {
    id: evento.id,
    fecha: evento.fecha.toISOString(),
    clienteId: evento.clienteId,
    clienteNombre: evento.cliente.name,
    opcionMenuId: evento.opcionMenuId,
    opcionMenuNombre: nombreOpcionesEvento(evento),
    opciones: opcionesOrdenadas(evento).map((o) => ({
      opcionMenuId: o.opcionMenuId,
      opcionMenuNombre: o.opcionMenu.name,
      numeroPersonas: o.numeroPersonas,
    })),
    numeroPersonas: evento.numeroPersonas,
    valorAntesImpuestos,
    valorDespuesImpuestos: Number(evento.valorDespuesImpuestos),
    taxRateId: evento.taxRateId,
    taxRateNombre: evento.taxRate?.name ?? null,
    vendedorId: evento.vendedorId,
    vendedorNombre: evento.vendedor?.name ?? null,
    costoTotal,
    costoTotalPorcentaje: calcularCostoPorcentaje(costoTotal, valorAntesImpuestos),
    utilidadOperacional: utilidad.valor,
    utilidadOperacionalPorcentaje: utilidad.porcentaje,
    registeredByName: evento.registeredBy.name,
    createdAt: evento.createdAt.toISOString(),
  };
}

function serializeConsumo(consumo: EventoWithDetail['consumos'][number]) {
  return {
    id: consumo.id,
    eventoId: consumo.eventoId,
    articuloId: consumo.articuloId,
    articuloNombre: consumo.articulo.name,
    articuloCodigo: consumo.articulo.code,
    quantity: Number(consumo.quantity),
    unit: consumo.unit,
    unitCost: Number(consumo.unitCost),
    subtotal: Number(consumo.subtotal),
    createdAt: consumo.createdAt.toISOString(),
  };
}

function serializeDetail(evento: EventoWithDetail) {
  return {
    ...serializeSummary(evento),
    consumos: evento.consumos.map(serializeConsumo),
  };
}

export async function listEventos() {
  const eventos = await prisma.evento.findMany({
    include: includeSummary,
    orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
  });
  return eventos.map(serializeSummary);
}

export async function getEvento(id: string) {
  const evento = await prisma.evento.findUnique({ where: { id }, include: includeDetail });
  if (!evento) {
    throw new HttpError(404, 'Evento no encontrado');
  }
  return serializeDetail(evento);
}

// Trazabilidad: quién vendió el evento, no solo quién lo digitó en el
// sistema (registeredById) — mismo criterio que Negocio/Cotización.
async function findVendedorOrThrow(vendedorId: string) {
  const vendedor = await prisma.user.findUnique({ where: { id: vendedorId } });
  if (!vendedor || !vendedor.active) {
    throw new HttpError(404, 'Vendedor no encontrado o inactivo');
  }
  return vendedor;
}

async function resolveValorDespuesImpuestos(
  valorAntesImpuestos: number,
  taxRateId: string | null | undefined,
) {
  if (!taxRateId) {
    return { valorDespuesImpuestos: valorAntesImpuestos, taxRateId: null };
  }
  const taxRate = await prisma.taxRate.findUnique({ where: { id: taxRateId } });
  if (!taxRate) {
    throw new HttpError(404, 'Tarifa de impuesto no encontrada');
  }
  return {
    valorDespuesImpuestos: calcularValorDespuesImpuestos(valorAntesImpuestos, Number(taxRate.rate)),
    taxRateId,
  };
}

export async function createEvento(input: EventoInput, registeredById: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id: input.clienteId } });
  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }
  await assertOpcionesExisten(input.opciones.map((o) => o.opcionMenuId));
  const vendedor = await findVendedorOrThrow(input.vendedorId);

  const { valorDespuesImpuestos, taxRateId } = await resolveValorDespuesImpuestos(
    input.valorAntesImpuestos,
    input.taxRateId,
  );

  const evento = await prisma.evento.create({
    data: {
      fecha: new Date(input.fecha),
      clienteId: input.clienteId,
      // La primera opción es la principal.
      opcionMenuId: input.opciones[0].opcionMenuId,
      opciones: { create: input.opciones },
      numeroPersonas: input.numeroPersonas,
      valorAntesImpuestos: input.valorAntesImpuestos,
      taxRateId,
      valorDespuesImpuestos,
      vendedorId: vendedor.id,
      registeredById,
    },
    include: includeSummary,
  });
  return serializeSummary(evento);
}

export async function updateEvento(id: string, input: EventoInput) {
  await findEventoOrThrow(id);

  const cliente = await prisma.cliente.findUnique({ where: { id: input.clienteId } });
  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }
  await assertOpcionesExisten(input.opciones.map((o) => o.opcionMenuId));
  const vendedor = await findVendedorOrThrow(input.vendedorId);

  const { valorDespuesImpuestos, taxRateId } = await resolveValorDespuesImpuestos(
    input.valorAntesImpuestos,
    input.taxRateId,
  );

  // Las opciones de menú se reemplazan completas (deleteMany + createMany)
  // en la misma transacción que la actualización del evento.
  const evento = await prisma.$transaction(
    async (tx) => {
      await tx.eventoOpcionMenu.deleteMany({ where: { eventoId: id } });
      await tx.eventoOpcionMenu.createMany({
        data: input.opciones.map((o) => ({ eventoId: id, ...o })),
      });
      return tx.evento.update({
        where: { id },
        data: {
          fecha: new Date(input.fecha),
          clienteId: input.clienteId,
          opcionMenuId: input.opciones[0].opcionMenuId,
          numeroPersonas: input.numeroPersonas,
          valorAntesImpuestos: input.valorAntesImpuestos,
          taxRateId,
          valorDespuesImpuestos,
          vendedorId: vendedor.id,
        },
        include: includeSummary,
      });
    },
    { timeout: 20000 },
  );

  // Trazabilidad: si cambia el vendedor de la venta, la Agenda lo sigue.
  // updateMany porque la venta puede no tener registro de Agenda.
  await prisma.agendaEvento.updateMany({
    where: { eventoId: id },
    data: { vendedorId: vendedor.id },
  });

  return serializeSummary(evento);
}

export async function addConsumo(eventoId: string, input: EventoConsumoInput) {
  await findEventoOrThrow(eventoId);
  const articulo = await prisma.articulo.findUnique({ where: { id: input.articuloId } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }
  if (CATEGORIAS_MONITOREO.includes(articulo.category)) {
    throw new HttpError(
      400,
      'Esta categoría es solo de monitoreo de compras — no se registra como consumo de un evento.',
    );
  }

  // Costo del consumo (pedido por el negocio, ver elegirCostoUnitario en
  // evento.calculations.ts): promedio entre el último precio de compra y el
  // costo del inventario más reciente que tenga costo; si no hay ninguno,
  // el último costo con el que ya se cargó este artículo — nunca $0 si hay
  // algún dato registrado.
  const unitCost = await costoUnitarioDeArticulo(articulo);
  const subtotal = calcularSubtotalConsumo(input.quantity, unitCost);

  const consumo = await prisma.eventoConsumo.create({
    data: {
      eventoId,
      articuloId: input.articuloId,
      quantity: input.quantity,
      unit: articulo.unit,
      unitCost,
      subtotal,
    },
    include: { articulo: true },
  });
  return serializeConsumo(consumo);
}

export async function updateConsumoQuantity(eventoId: string, consumoId: string, quantity: number) {
  const consumo = await prisma.eventoConsumo.findFirst({ where: { id: consumoId, eventoId } });
  if (!consumo) {
    throw new HttpError(404, 'Consumo no encontrado');
  }
  const subtotal = calcularSubtotalConsumo(quantity, Number(consumo.unitCost));
  const updated = await prisma.eventoConsumo.update({
    where: { id: consumoId },
    data: { quantity, subtotal },
    include: { articulo: true },
  });
  return serializeConsumo(updated);
}

export async function removeConsumo(eventoId: string, consumoId: string) {
  const consumo = await prisma.eventoConsumo.findFirst({ where: { id: consumoId, eventoId } });
  if (!consumo) {
    throw new HttpError(404, 'Consumo no encontrado');
  }
  await prisma.eventoConsumo.delete({ where: { id: consumoId } });
}

// Borrado real de una venta completa — pedido por el negocio para poder
// corregir errores. Se bloquea si ya tiene abonos/pagos registrados en
// Cartera (borrar eso corrompería el histórico de pagos reales). Si el
// evento vino de un negocio ganado en el CRM, ese negocio vuelve a
// "Cotizado" en vez de quedar apuntando a un evento inexistente — así se
// puede corregir y volver a ganar. La Agenda y los consumos del evento
// se eliminan en cascada porque solo existen para describir ese evento.
export async function deleteEvento(id: string) {
  await findEventoOrThrow(id);

  const abonos = await prisma.abono.count({ where: { eventoId: id } });
  if (abonos > 0) {
    throw new HttpError(
      409,
      'No se puede eliminar: este evento ya tiene abonos/pagos registrados en Cartera.',
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.agendaEvento.deleteMany({ where: { eventoId: id } });
    await tx.negocio.updateMany({
      where: { eventoId: id },
      data: { eventoId: null, etapa: 'COTIZADO' },
    });
    await tx.evento.delete({ where: { id } });
  });
}

// Ranking de opciones de menú vendidas: cada línea de opción de un evento
// cuenta como una unidad vendida de esa opción (un evento con 2 opciones suma
// 1 a cada una), con las personas de ESA línea. El total de personas
// atendidas sigue siendo la suma de personas de los eventos (no de las líneas,
// para no duplicar a quien come dos opciones). Mismo criterio de fecha que el
// resto del ERP, de mayor a menor.
export async function getRankingOpciones(start: Date, end: Date) {
  const eventos = await prisma.evento.findMany({
    where: { fecha: { gte: start, lte: end } },
    select: {
      numeroPersonas: true,
      opcionMenuId: true,
      opcionMenu: { select: { name: true } },
      opciones: { select: { opcionMenuId: true, numeroPersonas: true, opcionMenu: { select: { name: true } } } },
    },
  });

  const porOpcion = new Map<
    string,
    { opcionMenuNombre: string; unidadesVendidas: number; personasAtendidas: number }
  >();
  for (const evento of eventos) {
    // Eventos sin líneas (no debería pasar tras la migración): se cuenta la
    // opción principal con las personas del evento.
    const lineas =
      evento.opciones.length > 0
        ? evento.opciones
        : [{ opcionMenuId: evento.opcionMenuId, numeroPersonas: evento.numeroPersonas, opcionMenu: evento.opcionMenu }];
    for (const linea of lineas) {
      const actual = porOpcion.get(linea.opcionMenuId) ?? {
        opcionMenuNombre: linea.opcionMenu.name,
        unidadesVendidas: 0,
        personasAtendidas: 0,
      };
      actual.unidadesVendidas += 1;
      actual.personasAtendidas += linea.numeroPersonas;
      porOpcion.set(linea.opcionMenuId, actual);
    }
  }

  const ranking = Array.from(porOpcion.entries())
    .map(([opcionMenuId, valores]) => ({ opcionMenuId, ...valores }))
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

  const totalPersonasAtendidas = eventos.reduce((sum, e) => sum + e.numeroPersonas, 0);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    totalPersonasAtendidas,
    ranking,
  };
}

async function assertOpcionesExisten(ids: string[]) {
  const unicos = [...new Set(ids)];
  const encontradas = await prisma.opcionMenu.count({ where: { id: { in: unicos } } });
  if (encontradas !== unicos.length) {
    throw new HttpError(404, 'Opción de menú no encontrada');
  }
}

async function findEventoOrThrow(id: string) {
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) {
    throw new HttpError(404, 'Evento no encontrado');
  }
  return evento;
}
