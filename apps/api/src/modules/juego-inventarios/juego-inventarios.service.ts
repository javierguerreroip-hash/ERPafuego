import { prisma } from '../../lib/prisma.js';
import { calcularCostoPorcentaje } from '../eventos/evento.calculations.js';
import { calcularCMV } from './juego-inventarios.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// El alcance de CMV se restringe a artículos de categoría MATERIA_PRIMA,
// igual que en el Dashboard (Fase 5) — ver decisión documentada en el README.
//
// Actualización post-lanzamiento (2026-09-24): este reporte ya no calcula
// "inventario final teórico" (eso vive en Inventario, Módulo 4) ni
// registra el conteo físico (se registra desde Inventario) — solo lee el
// InventarioFinalFisico ya guardado y lo usa para un único CMV.
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

  // El registro de inventario final físico se guarda con fecha a
  // medianoche UTC (mismo criterio que InventarioInicial), pero endDate
  // aquí es fin de día (23:59:59.999Z) para que las consultas por rango
  // (compras/eventos) incluyan todo el último día. Si se buscara con
  // endDate directamente, la igualdad exacta nunca haría match contra lo
  // guardado y el conteo físico parecería no quedar registrado aunque el
  // guardado sí hubiera funcionado.
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

    const finalFisico = finalesFisicosMap.get(articulo.id);
    const inventarioFinalFisicoValue = finalFisico ? Number(finalFisico.value) : 0;
    const inventarioFinalFisicoQuantity = finalFisico ? Number(finalFisico.quantity) : 0;

    const cmvValue = calcularCMV(inventarioInicialValue, comprasValue, inventarioFinalFisicoValue);

    return {
      articuloId: articulo.id,
      articuloNombre: articulo.name,
      articuloCodigo: articulo.code,
      unit: articulo.unit,
      inventarioInicialValue,
      comprasValue,
      inventarioFinalFisicoQuantity,
      inventarioFinalFisicoValue,
      inventarioFinalFisicoRegistrado: Boolean(finalFisico),
      cmvValue,
    };
  });

  const inventarioInicial = round2(detalle.reduce((sum, d) => sum + d.inventarioInicialValue, 0));
  const comprasTotal = round2(detalle.reduce((sum, d) => sum + d.comprasValue, 0));
  const inventarioFinalFisico = round2(
    detalle.reduce((sum, d) => sum + d.inventarioFinalFisicoValue, 0),
  );

  const cmvValue = calcularCMV(inventarioInicial, comprasTotal, inventarioFinalFisico);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    ventasTotales,
    consolidado: {
      inventarioInicial,
      compras: comprasTotal,
      inventarioFinalFisico,
      cmv: {
        valor: cmvValue,
        porcentaje: calcularCostoPorcentaje(cmvValue, ventasTotales),
      },
    },
    detalle,
  };
}
