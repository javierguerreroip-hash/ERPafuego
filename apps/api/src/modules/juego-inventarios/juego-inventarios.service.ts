import type { InventarioFinalFisicoInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularCostoPorcentaje } from '../eventos/evento.calculations.js';
import { calcularInventarioFinal } from '../inventario/inventario.calculations.js';
import { calcularCMV, calcularDesviacionCMV } from './juego-inventarios.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// El alcance de CMV se restringe a artículos de categoría MATERIA_PRIMA,
// igual que en el Dashboard (Fase 5) — ver decisión documentada en el README.
export async function getJuegoInventariosReporte(startDate: Date, endDate: Date) {
  const articulos = await prisma.articulo.findMany({
    where: { category: 'MATERIA_PRIMA', active: true },
    orderBy: { name: 'asc' },
  });
  const articuloIds = articulos.map((a) => a.id);

  const eventos = await prisma.evento.findMany({
    where: { fecha: { gte: startDate, lte: endDate } },
    select: { valorAntesImpuestos: true },
  });
  const ventasTotales = round2(
    eventos.reduce((sum, e) => sum + Number(e.valorAntesImpuestos), 0),
  );

  const iniciales = await prisma.inventarioInicial.findMany({
    where: { fecha: startDate, articuloId: { in: articuloIds } },
  });
  const inicialesMap = new Map(iniciales.map((i) => [i.articuloId, Number(i.value)]));

  const compras = await prisma.compra.findMany({
    where: { fecha: { gte: startDate, lte: endDate }, articuloId: { in: articuloIds } },
    select: { articuloId: true, totalValue: true },
  });
  const comprasMap = new Map<string, number>();
  for (const c of compras) {
    comprasMap.set(c.articuloId, (comprasMap.get(c.articuloId) ?? 0) + Number(c.totalValue));
  }

  const consumos = await prisma.eventoConsumo.findMany({
    where: { articuloId: { in: articuloIds }, evento: { fecha: { gte: startDate, lte: endDate } } },
    select: { articuloId: true, subtotal: true },
  });
  const consumosMap = new Map<string, number>();
  for (const c of consumos) {
    consumosMap.set(c.articuloId, (consumosMap.get(c.articuloId) ?? 0) + Number(c.subtotal));
  }

  // El registro de inventario final físico se guarda con fecha a
  // medianoche UTC (mismo criterio que InventarioInicial), pero endDate
  // aquí es fin de día (23:59:59.999Z) para que las consultas por rango
  // (compras/consumos/eventos) incluyan todo el último día. Si se
  // buscara con endDate directamente, la igualdad exacta nunca haría
  // match contra lo guardado y el conteo físico parecería no quedar
  // registrado aunque el guardado sí hubiera funcionado.
  const endDateAtMidnight = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()),
  );
  const finalesFisicos = await prisma.inventarioFinalFisico.findMany({
    where: { fecha: endDateAtMidnight, articuloId: { in: articuloIds } },
  });
  const finalesFisicosMap = new Map(finalesFisicos.map((f) => [f.articuloId, f]));

  const detalle = articulos.map((articulo) => {
    const inventarioInicialValue = inicialesMap.get(articulo.id) ?? 0;
    const comprasValue = round2(comprasMap.get(articulo.id) ?? 0);
    const consumoValue = round2(consumosMap.get(articulo.id) ?? 0);
    const inventarioFinalSistemaValue = calcularInventarioFinal(
      inventarioInicialValue,
      comprasValue,
      consumoValue,
    );

    const finalFisico = finalesFisicosMap.get(articulo.id);
    const inventarioFinalFisicoValue = finalFisico ? Number(finalFisico.value) : 0;
    const inventarioFinalFisicoQuantity = finalFisico ? Number(finalFisico.quantity) : 0;

    const cmvTeoricoValue = calcularCMV(inventarioInicialValue, comprasValue, inventarioFinalSistemaValue);
    const cmvRealValue = calcularCMV(inventarioInicialValue, comprasValue, inventarioFinalFisicoValue);

    return {
      articuloId: articulo.id,
      articuloNombre: articulo.name,
      articuloCodigo: articulo.code,
      unit: articulo.unit,
      inventarioInicialValue,
      comprasValue,
      inventarioFinalSistemaValue,
      inventarioFinalFisicoQuantity,
      inventarioFinalFisicoValue,
      inventarioFinalFisicoRegistrado: Boolean(finalFisico),
      cmvTeoricoValue,
      cmvRealValue,
      desviacionValue: round2(cmvRealValue - cmvTeoricoValue),
    };
  });

  const inventarioInicial = round2(detalle.reduce((sum, d) => sum + d.inventarioInicialValue, 0));
  const comprasTotal = round2(detalle.reduce((sum, d) => sum + d.comprasValue, 0));
  const inventarioFinalSistema = round2(
    detalle.reduce((sum, d) => sum + d.inventarioFinalSistemaValue, 0),
  );
  const inventarioFinalFisico = round2(
    detalle.reduce((sum, d) => sum + d.inventarioFinalFisicoValue, 0),
  );

  const cmvTeoricoValue = calcularCMV(inventarioInicial, comprasTotal, inventarioFinalSistema);
  const cmvRealValue = calcularCMV(inventarioInicial, comprasTotal, inventarioFinalFisico);
  const desviacion = calcularDesviacionCMV(cmvRealValue, cmvTeoricoValue);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    ventasTotales,
    consolidado: {
      inventarioInicial,
      compras: comprasTotal,
      inventarioFinalSistema,
      inventarioFinalFisico,
      cmvTeorico: {
        valor: cmvTeoricoValue,
        porcentaje: calcularCostoPorcentaje(cmvTeoricoValue, ventasTotales),
      },
      cmvReal: {
        valor: cmvRealValue,
        porcentaje: calcularCostoPorcentaje(cmvRealValue, ventasTotales),
      },
      desviacion,
    },
    detalle,
  };
}

export async function setInventarioFinalFisico(
  input: InventarioFinalFisicoInput,
  registeredById: string,
) {
  const articulo = await prisma.articulo.findUnique({ where: { id: input.articuloId } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }

  const unitCost = input.unitCost ?? Number(articulo.lastPurchasePrice);
  const value = round2(input.quantity * unitCost);
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);

  const registro = await prisma.inventarioFinalFisico.upsert({
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
    id: registro.id,
    articuloId: registro.articuloId,
    fecha: registro.fecha.toISOString(),
    quantity: Number(registro.quantity),
    unit: registro.unit,
    unitCost: Number(registro.unitCost),
    value: Number(registro.value),
  };
}
