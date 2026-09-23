import { GASTO_ADMINISTRATIVO_RUBROS } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { calcularCostoPorcentaje } from '../eventos/evento.calculations.js';
import { getJuegoInventariosReporte } from '../juego-inventarios/juego-inventarios.service.js';
import { calcularTotalGastosAdministrativos } from '../gastos-administrativos/gasto-administrativo.calculations.js';
import { calcularUtilidadNeta } from './estado-resultados.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Los gastos administrativos se registran mensualmente (Módulo 6). Si el
// período consultado no coincide con un mes calendario exacto, se incluyen
// los meses cuyo (año, mes) cae dentro del rango — no se prorratea por día,
// porque la especificación no pide ese nivel de detalle.
function enumerarMeses(start: Date, end: Date): { year: number; month: number }[] {
  const meses: { year: number; month: number }[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= endCursor) {
    meses.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return meses;
}

export async function getEstadoResultados(startDate: Date, endDate: Date) {
  // 1. Ingreso total = ventas totales del período (Módulo 3)
  const eventos = await prisma.evento.findMany({
    where: { fecha: { gte: startDate, lte: endDate } },
    select: { valorAntesImpuestos: true },
  });
  const ingresoTotal = round2(eventos.reduce((sum, e) => sum + Number(e.valorAntesImpuestos), 0));

  // 2. CMV real (Módulo "Juego de Inventarios") — se reutiliza tal cual,
  // ya incluye el alcance "solo materia prima".
  const juegoInventarios = await getJuegoInventariosReporte(startDate, endDate);
  const cmv = juegoInventarios.consolidado.cmvReal.valor;

  // 3. Gastos de venta = todo consumo de eventos que NO sea materia prima
  // (mano de obra, transporte, artístico, alquiler de menaje — ver
  // decisión documentada en el README sobre "alquileres en general").
  // Insumos de Aseo nunca genera un EventoConsumo (el backend lo rechaza
  // en addConsumo), pero se excluye también aquí por si acaso — es un
  // gasto operativo aparte, no debe colarse en el resultado operativo.
  const consumosGastoVenta = await prisma.eventoConsumo.findMany({
    where: {
      evento: { fecha: { gte: startDate, lte: endDate } },
      articulo: { category: { notIn: ['MATERIA_PRIMA', 'INSUMOS_ASEO'] } },
    },
    select: { subtotal: true },
  });
  const gastosVenta = round2(consumosGastoVenta.reduce((sum, c) => sum + Number(c.subtotal), 0));

  // 4. Gastos administrativos = total del Módulo 6 para los meses del período.
  const meses = enumerarMeses(startDate, endDate);
  const gastosAdminRegistros =
    meses.length > 0
      ? await prisma.gastoAdministrativo.findMany({ where: { OR: meses } })
      : [];
  const gastosAdministrativos = round2(
    gastosAdminRegistros.reduce((sum, g) => {
      const rubros = Object.fromEntries(
        GASTO_ADMINISTRATIVO_RUBROS.map((rubro) => [rubro, Number(g[rubro])]),
      ) as Record<(typeof GASTO_ADMINISTRATIVO_RUBROS)[number], number>;
      return sum + calcularTotalGastosAdministrativos(rubros);
    }, 0),
  );

  // 5. Utilidad neta
  const utilidadNeta = calcularUtilidadNeta(ingresoTotal, cmv, gastosVenta, gastosAdministrativos);

  function pilar(valor: number) {
    return { valor, porcentaje: calcularCostoPorcentaje(valor, ingresoTotal) };
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    ingresoTotal: { valor: ingresoTotal, porcentaje: calcularCostoPorcentaje(ingresoTotal, ingresoTotal) },
    cmv: pilar(cmv),
    gastosVenta: pilar(gastosVenta),
    gastosAdministrativos: pilar(gastosAdministrativos),
    utilidadNeta,
  };
}
