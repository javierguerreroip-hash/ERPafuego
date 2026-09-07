import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import {
  calcularAuxilioTransporte,
  calcularTotalDevengadoHoras,
  calcularValorPorConcepto,
  clasificarTurno,
  sumarDesgloses,
} from './nomina.calculations.js';
import { getParametrosRaw } from './parametro-nomina.service.js';
import { getFestivosSet } from './dia-festivo.service.js';
import { listTurnos } from './turno.service.js';

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

  const turnos = await prisma.turno.findMany({
    where: { userId, horaEntrada: { gte: start, lte: end }, horaSalida: { not: null } },
    orderBy: { horaEntrada: 'asc' },
  });

  // Margen de un día a cada lado: un turno nocturno que empieza el último
  // día del período puede extenderse al día calendario siguiente, y ese
  // día también debe poder chequearse contra el calendario de festivos.
  const festivosStart = new Date(start.getTime() - 24 * 3600 * 1000);
  const festivosEnd = new Date(end.getTime() + 24 * 3600 * 1000);
  const festivos = await getFestivosSet(festivosStart, festivosEnd);
  const esFestivo = (fecha: string) => festivos.has(fecha);

  const desgloses = turnos.map((t) => clasificarTurno(t.horaEntrada, t.horaSalida!, esFestivo));
  const desglose = sumarDesgloses(desgloses);

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
    turnos.map((t) => t.horaEntrada.toISOString().slice(0, 10)),
  ).size;
  const auxilioTransporte = calcularAuxilioTransporte(
    Number(parametros.auxilioTransporte),
    diasTrabajados,
  );

  const totalAPagar = Math.round((totalDevengadoHoras + auxilioTransporte + Number.EPSILON) * 100) / 100;

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
    totalAPagar,
    turnos: turnosDTO,
  };
}
