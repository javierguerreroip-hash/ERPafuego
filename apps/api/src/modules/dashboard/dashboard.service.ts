import type { ArticuloCategoria } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { calcularCostoPorcentaje, calcularUtilidadOperacional } from '../eventos/evento.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const CATEGORIAS: ArticuloCategoria[] = [
  'MATERIA_PRIMA',
  'MANO_DE_OBRA',
  'SERVICIO_TRANSPORTE',
  'SERVICIOS_ARTISTICOS',
  'ALQUILER_MENAJE_EQUIPOS',
];

export async function getDashboard(startDate: Date, endDate: Date) {
  const eventos = await prisma.evento.findMany({
    where: { fecha: { gte: startDate, lte: endDate } },
    include: { consumos: { include: { articulo: true } } },
    orderBy: { fecha: 'asc' },
  });

  // Insumos de Aseo (post-lanzamiento, 2026-09-23): categoría de monitoreo
  // de compras, no de costeo por evento — a propósito NO entra en
  // costosTotales/utilidadOperativa/composicionCostos (esos solo suman
  // EventoConsumo, y esta categoría nunca genera uno — ver
  // evento.service.ts). Se calcula aparte, directo de Compras, solo para
  // que el negocio pueda vigilar cuánto está gastando en aseo.
  const comprasInsumosAseo = await prisma.compra.findMany({
    where: {
      fecha: { gte: startDate, lte: endDate },
      articulo: { category: 'INSUMOS_ASEO' },
    },
    select: { totalValue: true },
  });
  const comprasInsumosAseoValor = round2(
    comprasInsumosAseo.reduce((sum, c) => sum + Number(c.totalValue), 0),
  );

  let ventasTotales = 0;
  const categoriaTotales = Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) as Record<
    ArticuloCategoria,
    number
  >;
  const porDia = new Map<string, { ventas: number; costos: number }>();

  for (const evento of eventos) {
    const ventaEvento = Number(evento.valorAntesImpuestos);
    ventasTotales += ventaEvento;

    let costoEvento = 0;
    for (const consumo of evento.consumos) {
      const subtotal = Number(consumo.subtotal);
      costoEvento += subtotal;
      // Guard: solo suma categorías que este indicador realmente cubre
      // (Insumos de Aseo nunca debería llegar aquí — addConsumo la
      // rechaza — pero así no corrompe el total si algún día cambiara).
      if (categoriaTotales[consumo.articulo.category] !== undefined) {
        categoriaTotales[consumo.articulo.category] += subtotal;
      }
    }

    const dayKey = evento.fecha.toISOString().slice(0, 10);
    const prev = porDia.get(dayKey) ?? { ventas: 0, costos: 0 };
    porDia.set(dayKey, { ventas: prev.ventas + ventaEvento, costos: prev.costos + costoEvento });
  }

  const costosTotalesValor = round2(
    CATEGORIAS.reduce((sum, categoria) => sum + categoriaTotales[categoria], 0),
  );
  const utilidad = calcularUtilidadOperacional(ventasTotales, costosTotalesValor);

  function indicador(valor: number) {
    return { valor: round2(valor), porcentaje: calcularCostoPorcentaje(valor, ventasTotales) };
  }

  const tendencia = Array.from(porDia.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([fecha, v]) => ({
      fecha,
      ventas: round2(v.ventas),
      utilidad: round2(v.ventas - v.costos),
    }));

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    ventasTotales: round2(ventasTotales),
    costosTotales: indicador(costosTotalesValor),
    utilidadOperativa: utilidad,
    cmvMateriaPrima: indicador(categoriaTotales.MATERIA_PRIMA),
    manoDeObra: indicador(categoriaTotales.MANO_DE_OBRA),
    serviciosTransporte: indicador(categoriaTotales.SERVICIO_TRANSPORTE),
    serviciosArtisticos: indicador(categoriaTotales.SERVICIOS_ARTISTICOS),
    composicionCostos: CATEGORIAS.map((categoria) => ({
      categoria,
      valor: round2(categoriaTotales[categoria]),
    })),
    tendencia,
    comprasInsumosAseo: comprasInsumosAseoValor,
  };
}
