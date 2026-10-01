import type { DesgloseHorasDTO } from '@erp-afuego/shared';

// Colombia no tiene horario de verano — offset fijo UTC-5. Toda la
// clasificación de horas (diurna/nocturna, día calendario para
// dominical/festivo) se hace en "hora Colombia", independiente de la zona
// horaria donde corra el servidor.
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;
const JORNADA_ORDINARIA_MINUTOS = 8 * 60;

// El almuerzo lo asume el empleado (no es tiempo de trabajo) — se
// descuenta media hora de cada turno completo, pedido por el negocio
// 2026-09-15. Se resta de las horas ORDINARIAS (nunca de horas extra ni
// dominicales/festivas, que sí son un derecho económico ya causado), y
// primero de la diurna porque el almuerzo normalmente cae al mediodía;
// solo si un turno no tiene suficiente diurna ordinaria (turnos 100%
// nocturnos) se completa desde la nocturna ordinaria.
const ALMUERZO_HORAS = 0.5;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function aColombia(date: Date): Date {
  return new Date(date.getTime() - COLOMBIA_OFFSET_MS);
}

function esNoche(colombiaDate: Date): boolean {
  const h = colombiaDate.getUTCHours();
  return h >= 19 || h < 6;
}

function fechaISO(colombiaDate: Date): string {
  return colombiaDate.toISOString().slice(0, 10);
}

function esDomingo(colombiaDate: Date): boolean {
  return colombiaDate.getUTCDay() === 0;
}

// Clave de la semana calendario (lunes a domingo, hora Colombia) a la
// que pertenece un turno — la fecha ISO de su lunes.
function semanaISO(horaEntradaUtc: Date): string {
  const col = aColombia(horaEntradaUtc);
  const diaSemana = col.getUTCDay(); // 0=domingo … 6=sábado
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(col.getTime() - diasDesdeElLunes * 24 * 3600 * 1000);
  return fechaISO(lunes);
}

// Genera los puntos de quiebre (en tiempo real) dentro de (entrada, salida):
// cada cruce de las 6:00/19:00 y cada medianoche en hora Colombia — son los
// únicos instantes donde puede cambiar la clasificación diurna/nocturna o
// el día calendario (para dominical/festivo).
function puntosDeQuiebre(entradaUtc: Date, salidaUtc: Date): Date[] {
  const puntos: Date[] = [];
  const entradaCol = aColombia(entradaUtc);
  const cursor = new Date(
    Date.UTC(entradaCol.getUTCFullYear(), entradaCol.getUTCMonth(), entradaCol.getUTCDate()),
  );

  // Margen de seguridad: recorre día por día mientras el inicio del día
  // (en tiempo real) sea anterior a la salida.
  while (new Date(cursor.getTime() + COLOMBIA_OFFSET_MS) < salidaUtc) {
    for (const horas of [0, 6, 19]) {
      const candidatoCol = new Date(cursor.getTime() + horas * 3600 * 1000);
      const candidatoUtc = new Date(candidatoCol.getTime() + COLOMBIA_OFFSET_MS);
      if (candidatoUtc > entradaUtc && candidatoUtc < salidaUtc) {
        puntos.push(candidatoUtc);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return puntos.sort((a, b) => a.getTime() - b.getTime());
}

function desgloseVacio(): DesgloseHorasDTO {
  return {
    diurnaOrdinaria: 0,
    nocturnaOrdinaria: 0,
    extraDiurna: 0,
    extraNocturna: 0,
    dominicalFestivaDiurna: 0,
    dominicalFestivaNocturna: 0,
    extraDiurnaDominicalFestiva: 0,
    extraNocturnaDominicalFestiva: 0,
  };
}

// Clasifica las horas de un turno en los 8 conceptos del Código
// Sustantivo del Trabajo colombiano. Simplificación documentada: se toma
// la jornada ordinaria como las primeras 8 horas de CADA turno (no un
// acumulado semanal) — es la referencia estándar por turno/día que usa la
// mayoría del software de nómina colombiano para turnos individuales.
export function clasificarTurno(
  horaEntrada: Date,
  horaSalida: Date,
  esFestivo: (fechaISOStr: string) => boolean,
): DesgloseHorasDTO {
  const desglose = desgloseVacio();
  if (horaSalida <= horaEntrada) return desglose;

  const quiebres = puntosDeQuiebre(horaEntrada, horaSalida);
  const bordes = [horaEntrada, ...quiebres, horaSalida];

  let minutosOrdinariosUsados = 0;

  for (let i = 0; i < bordes.length - 1; i++) {
    const inicio = bordes[i];
    const fin = bordes[i + 1];
    const minutosSegmento = (fin.getTime() - inicio.getTime()) / 60000;
    if (minutosSegmento <= 0) continue;

    const puntoMedio = new Date(inicio.getTime() + (fin.getTime() - inicio.getTime()) / 2);
    const colMedio = aColombia(puntoMedio);
    const noche = esNoche(colMedio);
    const domFest = esDomingo(colMedio) || esFestivo(fechaISO(colMedio));

    const minutosOrdinariosDisponibles = Math.max(
      0,
      JORNADA_ORDINARIA_MINUTOS - minutosOrdinariosUsados,
    );
    const minutosOrdinarios = Math.min(minutosSegmento, minutosOrdinariosDisponibles);
    const minutosExtra = minutosSegmento - minutosOrdinarios;
    minutosOrdinariosUsados += minutosOrdinarios;

    const horasOrdinarias = minutosOrdinarios / 60;
    const horasExtra = minutosExtra / 60;

    if (domFest) {
      if (noche) {
        desglose.dominicalFestivaNocturna += horasOrdinarias;
        desglose.extraNocturnaDominicalFestiva += horasExtra;
      } else {
        desglose.dominicalFestivaDiurna += horasOrdinarias;
        desglose.extraDiurnaDominicalFestiva += horasExtra;
      }
    } else if (noche) {
      desglose.nocturnaOrdinaria += horasOrdinarias;
      desglose.extraNocturna += horasExtra;
    } else {
      desglose.diurnaOrdinaria += horasOrdinarias;
      desglose.extraDiurna += horasExtra;
    }
  }

  for (const key of Object.keys(desglose) as (keyof DesgloseHorasDTO)[]) {
    desglose[key] = round2(desglose[key]);
  }
  return descontarAlmuerzo(desglose);
}

// Orden en el que se descuenta el almuerzo: primero diurna ordinaria
// (el caso normal), luego nocturna ordinaria (turnos 100% nocturnos),
// luego dominical/festiva diurna y nocturna (el almuerzo también aplica
// en domingo/festivo). Las 4 categorías de horas EXTRA nunca se tocan —
// son un derecho económico ya causado por trabajar más allá de la
// jornada ordinaria, el almuerzo no debe reducirlas.
const ORDEN_DEDUCCION_ALMUERZO: (keyof DesgloseHorasDTO)[] = [
  'diurnaOrdinaria',
  'nocturnaOrdinaria',
  'dominicalFestivaDiurna',
  'dominicalFestivaNocturna',
];

function descontarAlmuerzo(desglose: DesgloseHorasDTO): DesgloseHorasDTO {
  let restante = ALMUERZO_HORAS;
  const resultado = { ...desglose };

  for (const key of ORDEN_DEDUCCION_ALMUERZO) {
    if (restante <= 0) break;
    const aRestar = Math.min(resultado[key], restante);
    resultado[key] = round2(resultado[key] - aRestar);
    restante = round2(restante - aRestar);
  }

  return resultado;
}

export function sumarDesgloses(desgloses: DesgloseHorasDTO[]): DesgloseHorasDTO {
  const total = desgloseVacio();
  for (const d of desgloses) {
    for (const key of Object.keys(total) as (keyof DesgloseHorasDTO)[]) {
      total[key] = round2(total[key] + d[key]);
    }
  }
  return total;
}

export interface TurnoConDesglose {
  horaEntrada: Date;
  desglose: DesgloseHorasDTO;
}

// Tope semanal de horas ordinarias (Art. 161 CST, reformado por la Ley
// 2101 de 2021 — post-lanzamiento, 2026-10-01). Además del tope de 8h
// por turno que ya aplica `clasificarTurno`, la ley colombiana limita el
// total de horas ORDINARIAS (diurna + nocturna; nunca la dominical/
// festiva, que se rige aparte, ni la extra que un turno ya generó por su
// propio tope diario) dentro de una semana calendario (lunes a domingo,
// hora Colombia) a un máximo que bajó de forma escalonada: 47h
// (jul-2023), 46h (jul-2024), 44h (jul-2025), 42h desde el 15 de julio
// de 2026 — valor configurable en ParametroNomina.jornadaSemanalMaxima,
// nunca fijo aquí, porque la ley lo va a volver a cambiar.
//
// Lo que exceda el tope semanal se reclasifica a extra (diurna/nocturna,
// según de dónde venían las horas), tomando el excedente de los turnos
// MÁS RECIENTES de la semana en orden cronológico — un trabajador nunca
// "pierde" horas ordinarias que ya trabajó al principio de la semana por
// algo que pase después.
//
// Requiere los turnos de la semana COMPLETA (lunes a domingo), no solo
// los de un período de pago — una quincena casi nunca empieza en lunes,
// así que quien llama debe incluir turnos de fuera del período que
// pertenezcan a la misma semana calendario (ver liquidacion.service.ts)
// y luego filtrar el resultado de vuelta al período a pagar.
export function aplicarTopeSemanal(
  turnos: TurnoConDesglose[],
  topeSemanalHoras: number,
): TurnoConDesglose[] {
  const porSemana = new Map<string, TurnoConDesglose[]>();
  for (const t of turnos) {
    const clave = semanaISO(t.horaEntrada);
    const lista = porSemana.get(clave) ?? [];
    lista.push(t);
    porSemana.set(clave, lista);
  }

  const resultado: TurnoConDesglose[] = [];
  for (const lista of porSemana.values()) {
    const ordenada = [...lista].sort((a, b) => a.horaEntrada.getTime() - b.horaEntrada.getTime());
    let acumuladoOrdinaria = 0;

    for (const t of ordenada) {
      const d = { ...t.desglose };
      const ordinariaTurno = round2(d.diurnaOrdinaria + d.nocturnaOrdinaria);
      const disponible = Math.max(0, round2(topeSemanalHoras - acumuladoOrdinaria));
      const aUsar = Math.min(ordinariaTurno, disponible);
      const excedente = round2(ordinariaTurno - aUsar);
      acumuladoOrdinaria = round2(acumuladoOrdinaria + aUsar);

      if (excedente > 0 && ordinariaTurno > 0) {
        const fraccionDiurna = d.diurnaOrdinaria / ordinariaTurno;
        const excedenteDiurna = round2(excedente * fraccionDiurna);
        const excedenteNocturna = round2(excedente - excedenteDiurna);
        d.diurnaOrdinaria = round2(d.diurnaOrdinaria - excedenteDiurna);
        d.nocturnaOrdinaria = round2(d.nocturnaOrdinaria - excedenteNocturna);
        d.extraDiurna = round2(d.extraDiurna + excedenteDiurna);
        d.extraNocturna = round2(d.extraNocturna + excedenteNocturna);
      }

      resultado.push({ horaEntrada: t.horaEntrada, desglose: d });
    }
  }

  return resultado;
}

export interface TasasRecargo {
  recargoNocturno: number;
  recargoExtraDiurna: number;
  recargoExtraNocturna: number;
  recargoDominicalFestiva: number;
  recargoNocturnoDomFestivo: number;
  recargoExtraDiurnaDomFestiva: number;
  recargoExtraNocturnaDomFestiva: number;
}

// Valor en pesos de cada concepto del desglose, aplicando el recargo
// correspondiente sobre la hora ordinaria (la diurna ordinaria no lleva
// recargo — es la base 100%).
export function calcularValorPorConcepto(
  desglose: DesgloseHorasDTO,
  valorHoraOrdinaria: number,
  tasas: TasasRecargo,
): DesgloseHorasDTO {
  return {
    diurnaOrdinaria: round2(desglose.diurnaOrdinaria * valorHoraOrdinaria),
    nocturnaOrdinaria: round2(
      desglose.nocturnaOrdinaria * valorHoraOrdinaria * (1 + tasas.recargoNocturno),
    ),
    extraDiurna: round2(desglose.extraDiurna * valorHoraOrdinaria * (1 + tasas.recargoExtraDiurna)),
    extraNocturna: round2(
      desglose.extraNocturna * valorHoraOrdinaria * (1 + tasas.recargoExtraNocturna),
    ),
    dominicalFestivaDiurna: round2(
      desglose.dominicalFestivaDiurna * valorHoraOrdinaria * (1 + tasas.recargoDominicalFestiva),
    ),
    dominicalFestivaNocturna: round2(
      desglose.dominicalFestivaNocturna *
        valorHoraOrdinaria *
        (1 + tasas.recargoNocturnoDomFestivo),
    ),
    extraDiurnaDominicalFestiva: round2(
      desglose.extraDiurnaDominicalFestiva *
        valorHoraOrdinaria *
        (1 + tasas.recargoExtraDiurnaDomFestiva),
    ),
    extraNocturnaDominicalFestiva: round2(
      desglose.extraNocturnaDominicalFestiva *
        valorHoraOrdinaria *
        (1 + tasas.recargoExtraNocturnaDomFestiva),
    ),
  };
}

export function calcularTotalDevengadoHoras(valorPorConcepto: DesgloseHorasDTO): number {
  return round2(Object.values(valorPorConcepto).reduce((sum, v) => sum + v, 0));
}

// Incapacidad por enfermedad general (Ley 100 / CST): se paga como
// porcentaje configurable (66,67% confirmado con el usuario 2026-09-15,
// ver ParametroNomina.porcentajeIncapacidad) del salario DIARIO —
// SMLV/30, mismo criterio de "día" que ya usa el auxilio de transporte,
// no de la hora ordinaria (que depende del divisor de horas semanal).
export function calcularValorIncapacidad(
  smlv: number,
  porcentajeIncapacidad: number,
  diasIncapacidad: number,
): number {
  const salarioDiario = smlv / 30;
  return round2(salarioDiario * porcentajeIncapacidad * diasIncapacidad);
}

export interface Deducciones {
  deduccionEPS: number;
  deduccionAFP: number;
  totalDeducciones: number;
}

// Deducciones de EPS y AFP — confirmadas con el usuario 2026-09-15
// comparando contra la nómina manual que manejaban en Excel: 4% cada
// una sobre el total devengado (horas + incapacidad), SIN incluir el
// auxilio de transporte (que nunca es base de cotización). Porcentajes
// configurables en ParametroNomina, nunca fijos en el código.
export function calcularDeducciones(
  totalDevengado: number,
  porcentajeEPS: number,
  porcentajeAFP: number,
): Deducciones {
  const deduccionEPS = round2(totalDevengado * porcentajeEPS);
  const deduccionAFP = round2(totalDevengado * porcentajeAFP);
  return {
    deduccionEPS,
    deduccionAFP,
    totalDeducciones: round2(deduccionEPS + deduccionAFP),
  };
}

// Límites (lunes 00:00 a domingo 23:59:59.999, en UTC) de las semanas
// calendario completas que contienen `start` y `end` — post-lanzamiento,
// 2026-10-01, para poder traer los turnos de esas semanas completas y
// aplicar `aplicarTopeSemanal` correctamente aunque el período de pago
// (quincena) no empiece ni termine en lunes.
//
// `start`/`end` llegan como "medianoche UTC de la fecha calendario"
// (mismo criterio que el resto del módulo — ver controller), no como
// instantes reales, así que el día de la semana se lee directo de sus
// componentes UTC, sin pasar por `aColombia` (eso es solo para
// instantes reales como `horaEntrada`).
export function limiteSemanasCompletas(start: Date, end: Date): { desde: Date; hasta: Date } {
  const diaStart = start.getUTCDay(); // 0=domingo…6=sábado
  const diasDesdeElLunes = diaStart === 0 ? 6 : diaStart - 1;
  const desde = new Date(start.getTime() - diasDesdeElLunes * 24 * 3600 * 1000);

  const diaEnd = end.getUTCDay();
  const diasHastaElDomingo = diaEnd === 0 ? 0 : 7 - diaEnd;
  const hasta = new Date(end.getTime() + diasHastaElDomingo * 24 * 3600 * 1000);

  return { desde, hasta };
}

// Auxilio de transporte prorrateado por días trabajados (no por horas) —
// es un beneficio no salarial que se paga por día laborado, no por hora.
export function calcularAuxilioTransporte(
  auxilioMensual: number,
  diasTrabajados: number,
): number {
  return round2((auxilioMensual / 30) * diasTrabajados);
}
