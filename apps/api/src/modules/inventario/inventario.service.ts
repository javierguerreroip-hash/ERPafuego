import type { InventarioInicialInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularInventarioFinal } from './inventario.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// startDate/endDate ya vienen normalizadas a límites de día completo
// (00:00:00 y 23:59:59.999) por el controlador.
export async function getInventarioReporte(startDate: Date, endDate: Date) {
  // Insumos de Aseo es una categoría de monitoreo de compras (ver README),
  // no de inventario — no se consumen por evento ni tienen inventario
  // inicial/final, así que quedan fuera de este reporte a propósito.
  const articulos = await prisma.articulo.findMany({
    where: { active: true, category: { not: 'INSUMOS_ASEO' } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  const iniciales = await prisma.inventarioInicial.findMany({ where: { fecha: startDate } });
  const inicialesMap = new Map(iniciales.map((i) => [i.articuloId, i]));

  const compras = await prisma.compra.findMany({
    where: { fecha: { gte: startDate, lte: endDate } },
    select: { articuloId: true, quantity: true, totalValue: true },
  });
  const comprasMap = new Map<string, { quantity: number; value: number }>();
  for (const c of compras) {
    const prev = comprasMap.get(c.articuloId) ?? { quantity: 0, value: 0 };
    comprasMap.set(c.articuloId, {
      quantity: prev.quantity + Number(c.quantity),
      value: prev.value + Number(c.totalValue),
    });
  }

  const consumos = await prisma.eventoConsumo.findMany({
    where: { evento: { fecha: { gte: startDate, lte: endDate } } },
    select: { articuloId: true, quantity: true, subtotal: true },
  });
  const consumosMap = new Map<string, { quantity: number; value: number }>();
  for (const c of consumos) {
    const prev = consumosMap.get(c.articuloId) ?? { quantity: 0, value: 0 };
    consumosMap.set(c.articuloId, {
      quantity: prev.quantity + Number(c.quantity),
      value: prev.value + Number(c.subtotal),
    });
  }

  const detalle = articulos.map((articulo) => {
    const inicial = inicialesMap.get(articulo.id);
    const inicialQuantity = inicial ? Number(inicial.quantity) : 0;
    const inicialValue = inicial ? Number(inicial.value) : 0;
    const compra = comprasMap.get(articulo.id) ?? { quantity: 0, value: 0 };
    const consumo = consumosMap.get(articulo.id) ?? { quantity: 0, value: 0 };

    return {
      articuloId: articulo.id,
      articuloNombre: articulo.name,
      articuloCodigo: articulo.code,
      category: articulo.category,
      unit: articulo.unit,
      inventarioInicialQuantity: inicialQuantity,
      inventarioInicialValue: inicialValue,
      inventarioInicialRegistrado: Boolean(inicial),
      comprasQuantity: round2(compra.quantity),
      comprasValue: round2(compra.value),
      consumoQuantity: round2(consumo.quantity),
      consumoValue: round2(consumo.value),
      inventarioFinalQuantity: calcularInventarioFinal(inicialQuantity, compra.quantity, consumo.quantity),
      inventarioFinalValue: calcularInventarioFinal(inicialValue, compra.value, consumo.value),
    };
  });

  const consolidado = {
    inventarioInicialValue: round2(detalle.reduce((sum, d) => sum + d.inventarioInicialValue, 0)),
    comprasValue: round2(detalle.reduce((sum, d) => sum + d.comprasValue, 0)),
    consumoValue: round2(detalle.reduce((sum, d) => sum + d.consumoValue, 0)),
    inventarioFinalValue: round2(detalle.reduce((sum, d) => sum + d.inventarioFinalValue, 0)),
  };

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    detalle,
    consolidado,
  };
}

export async function setInventarioInicial(input: InventarioInicialInput, registeredById: string) {
  const articulo = await prisma.articulo.findUnique({ where: { id: input.articuloId } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }

  const unitCost = input.unitCost ?? Number(articulo.lastPurchasePrice);
  const value = round2(input.quantity * unitCost);
  // UTC explícito (ver comentario en inventario.controller.ts): debe
  // coincidir exactamente con cómo el reporte busca por fecha de inicio.
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);

  const inicial = await prisma.inventarioInicial.upsert({
    where: { articuloId_fecha: { articuloId: input.articuloId, fecha } },
    update: { quantity: input.quantity, unit: articulo.unit, unitCost, value, registeredById },
    create: {
      articuloId: input.articuloId,
      fecha,
      quantity: input.quantity,
      unit: articulo.unit,
      unitCost,
      value,
      registeredById,
    },
  });

  return {
    id: inicial.id,
    articuloId: inicial.articuloId,
    fecha: inicial.fecha.toISOString(),
    quantity: Number(inicial.quantity),
    unit: inicial.unit,
    unitCost: Number(inicial.unitCost),
    value: Number(inicial.value),
  };
}
