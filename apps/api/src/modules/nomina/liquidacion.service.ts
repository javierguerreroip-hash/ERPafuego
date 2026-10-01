import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import {
  aplicarTopeSemanal,
  calcularAuxilioTransporte,
  calcularDeducciones,
  calcularTotalDevengadoHoras,
  calcularValorIncapacidad,
  calcularValorPorConcepto,
  clasificarTurno,
  limiteSemanasCompletas,
  sumarDesgloses,
} from './nomina.calculations.js';
import { getParametrosRaw } from './parametro-nomina.service.js';
import { getFestivosSet } from './dia-festivo.service.js';
import { listTurnos } from './turno.service.js';
import { listIncapacidades } from './incapacidad.service.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Un turno se atribuye por completo a la quincena/período en que inicia
// (horaEntrada) — no se parte un turno que cruza la medianoche de fin de
// período. Simplificación documentada en el README.
export async function getLiquidacion(userId: string, start: Date, end: Date) {
  const empleado = await prisma.user.findUnique({ where: { id: userId } });
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }

  const parametros = await getParametrosRaw();
  const valorHoraOrdinaria =
    Math.round((Number(parametros.smlv) / Number(parametros.divisorHoras) + Number.EPSILON) * 100) /
    100;

  // Se traen los turnos de las semanas calendario COMPLETAS (lunes a
  // domingo) que tocan el período, no solo los del período de pago —
  // necesario para aplicar correctamente el tope semanal de horas
  // ordinarias (post-lanzamiento, 2026-10-01: ver aplicarTopeSemanal)
  // aunque la quincena casi nunca empiece ni termine en lunes. Al final
  // se filtra de vuelta solo lo que cae en [start, end] antes de sumar
  // lo que realmente se paga en ESTA liquidación — un turno de la
  // quincena anterior que ya se pagó no se vuelve a pagar aquí, pero sí
  // "gasta" su parte del tope semanal si comparte semana calendario con
  // turnos de este período.
  const { desde: semanaDesde, hasta: semanaHasta } = limiteSemanasCompletas(start, end);

  // Margen de un día a cada lado de esa ventana: un turno nocturno en el
  // borde puede extenderse al día calendario siguiente, y ese día
  // también debe poder chequearse contra el calendario de festivos.
  const festivosStart = new Date(semanaDesde.getTime() - 24 * 3600 * 1000);
  const festivosEnd = new Date(semanaHasta.getTime() + 24 * 3600 * 1000);
  const festivos = await getFestivosSet(festivosStart, festivosEnd);
  const esFestivo = (fecha: string) => festivos.has(fecha);

  const turnosSemanaCompleta = await prisma.turno.findMany({
    where: {
      userId,
      horaEntrada: { gte: semanaDesde, lte: semanaHasta },
      horaSalida: { not: null },
    },
    orderBy: { horaEntrada: 'asc' },
  });

  const desglosesPorTurno = turnosSemanaCompleta.map((t) => ({
    horaEntrada: t.horaEntrada,
    desglose: clasificarTurno(t.horaEntrada, t.horaSalida!, esFestivo),
  }));
  const conTopeSemanal = aplicarTopeSemanal(desglosesPorTurno, Number(parametros.jornadaSemanalMaxima));
  const turnosDelPeriodo = conTopeSemanal.filter(
    (t) => t.horaEntrada >= start && t.horaEntrada <= end,
  );
  const desglose = sumarDesgloses(turnosDelPeriodo.map((t) => t.desglose));

  const tasas = {
    recargoNocturno: Number(parametros.recargoNocturno),
    recargoExtraDiurna: Number(parametros.recargoExtraDiurna),
    recargoExtraNocturna: Number(parametros.recargoExtraNocturna),
    recargoDominicalFestiva: Number(parametros.recargoDominicalFestiva),
    recargoNocturnoDomFestivo: Number(parametros.recargoNocturnoDomFestivo),
    recargoExtraDiurnaDomFestiva: Number(parametros.recargoExtraDiurnaDomFestiva),
    recargoExtraNocturnaDomFestiva: Number(parametros.recargoExtraNocturnaDomFestiva),
  };

  const valorPorConcepto = calcularValorPorConcepto(desglose, valorHoraOrdinaria, tasas);
  const totalDevengadoHoras = calcularTotalDevengadoHoras(valorPorConcepto);

  const diasTrabajados = new Set(
    turnosDelPeriodo.map((t) => t.horaEntrada.toISOString().slice(0, 10)),
  ).size;
  const auxilioTransporte = calcularAuxilioTransporte(
    Number(parametros.auxilioTransporte),
    diasTrabajados,
  );

  const incapacidadesDTO = await listIncapacidades({ userId, start, end });
  const diasIncapacidad = incapacidadesDTO.length;
  const valorIncapacidad = calcularValorIncapacidad(
    Number(parametros.smlv),
    Number(parametros.porcentajeIncapacidad),
    diasIncapacidad,
  );

  // Base de EPS/AFP = total devengado por horas + incapacidad, SIN el
  // auxilio de transporte (nunca es base de cotización) — confirmado
  // 2026-09-15 comparando contra la nómina manual en Excel del negocio.
  const baseDeducciones = round2(totalDevengadoHoras + valorIncapacidad);
  const { deduccionEPS, deduccionAFP, totalDeducciones } = calcularDeducciones(
    baseDeducciones,
    Number(parametros.porcentajeEPS),
    Number(parametros.porcentajeAFP),
  );

  const totalAPagar = round2(baseDeducciones - totalDeducciones + auxilioTransporte);

  const turnosDTO = await listTurnos({ userId, start, end });

  return {
    userId,
    empleadoNombre: empleado.name,
    start: start.toISOString(),
    end: end.toISOString(),
    desglose,
    valorHoraOrdinaria,
    valorPorConcepto,
    totalDevengadoHoras,
    diasTrabajados,
    auxilioTransporte,
    diasIncapacidad,
    valorIncapacidad,
    deduccionEPS,
    deduccionAFP,
    totalDeducciones,
    totalAPagar,
    turnos: turnosDTO,
    incapacidades: incapacidadesDTO,
  };
}
