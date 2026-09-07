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
      categoriaTotales[consumo.articulo.category] += subtotal;
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
  };
}
