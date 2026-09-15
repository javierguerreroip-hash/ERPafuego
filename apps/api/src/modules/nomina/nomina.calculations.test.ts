import { describe, expect, it } from 'vitest';
import {
  calcularAuxilioTransporte,
  calcularDeducciones,
  calcularTotalDevengadoHoras,
  calcularValorIncapacidad,
  calcularValorPorConcepto,
  clasificarTurno,
  sumarDesgloses,
  type TasasRecargo,
} from './nomina.calculations.js';

// Tasas confirmadas por el usuario (ver README): recargo nocturno 35%,
// extra diurna 25%, extra nocturna 75%, dominical/festiva 90%, nocturno
// en dominical/festivo 125%, extra diurna dom/fest 115%, extra nocturna
// dom/fest 165%.
const TASAS: TasasRecargo = {
  recargoNocturno: 0.35,
  recargoExtraDiurna: 0.25,
  recargoExtraNocturna: 0.75,
  recargoDominicalFestiva: 0.9,
  recargoNocturnoDomFestivo: 1.25,
  recargoExtraDiurnaDomFestiva: 1.15,
  recargoExtraNocturnaDomFestiva: 1.65,
};

const VALOR_HORA = 8337.64; // SMLV 1.750.905 / 210, confirmado por el usuario
const sinFestivos = () => false;

// 2026-01-05 es lunes; 2026-01-04 es domingo.
function colombia(fechaHoraLocal: string): Date {
  // fechaHoraLocal en hora Colombia (UTC-5) → convierte a instante UTC real.
  return new Date(`${fechaHoraLocal}:00.000-05:00`);
}

describe('clasificarTurno', () => {
  // Todos los casos descuentan 0.5h de almuerzo (confirmado con el
  // usuario 2026-09-15) — el almuerzo lo asume el empleado y no cuenta
  // como tiempo de trabajo. Se resta de la jornada ordinaria, nunca de
  // horas extra.
  it('turno diurno de 8h en día ordinario: diurna ordinaria menos 0.5h de almuerzo', () => {
    const d = clasificarTurno(colombia('2026-01-05T08:00'), colombia('2026-01-05T16:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(7.5);
    expect(d.nocturnaOrdinaria).toBe(0);
    expect(d.extraDiurna).toBe(0);
  });

  it('turno que cruza a la noche (19:00) sin pasar de 8h: el almuerzo se descuenta de la diurna primero', () => {
    const d = clasificarTurno(colombia('2026-01-05T15:00'), colombia('2026-01-05T21:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(3.5); // 4h (15:00-19:00) - 0.5h almuerzo
    expect(d.nocturnaOrdinaria).toBe(2); // 19:00-21:00, sin tocar
  });

  it('turno largo nocturno (10h) genera horas extra nocturnas tras el tope de 8h, y el almuerzo no toca la extra', () => {
    // 18:00 lunes -> 04:00 martes: 1h diurna (18-19) + 9h nocturna (19-04)
    const d = clasificarTurno(colombia('2026-01-05T18:00'), colombia('2026-01-06T04:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(0.5); // 1h - 0.5h almuerzo (se cubre completo aquí)
    expect(d.nocturnaOrdinaria).toBe(7); // 8h ordinarias - 1h diurna ya usada, sin tocar
    expect(d.extraNocturna).toBe(2); // 9h nocturnas - 7h ordinarias restantes, sin tocar
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(9.5, 5); // 10h - 0.5h almuerzo
  });

  it('turno de 8h en domingo: dominical/festiva diurna menos 0.5h de almuerzo (sin extra)', () => {
    const d = clasificarTurno(colombia('2026-01-04T08:00'), colombia('2026-01-04T16:00'), sinFestivos);
    expect(d.dominicalFestivaDiurna).toBe(7.5);
    expect(d.diurnaOrdinaria).toBe(0);
  });

  it('turno de 10h en domingo: la extra dominical/festiva no se toca, el almuerzo sale de la ordinaria dominical', () => {
    const d = clasificarTurno(colombia('2026-01-04T07:00'), colombia('2026-01-04T17:00'), sinFestivos);
    expect(d.dominicalFestivaDiurna).toBe(7.5); // 8h - 0.5h almuerzo
    expect(d.extraDiurnaDominicalFestiva).toBe(2); // sin tocar
  });

  it('día marcado como festivo (no domingo) se trata igual que un domingo', () => {
    const esFestivo = (fecha: string) => fecha === '2026-01-06';
    const d = clasificarTurno(colombia('2026-01-06T08:00'), colombia('2026-01-06T16:00'), esFestivo);
    expect(d.dominicalFestivaDiurna).toBe(7.5);
  });

  it('turno corto (2h) sin suficiente ordinaria diurna: el almuerzo se completa desde la nocturna', () => {
    // 17:00-19:00: 2h diurnas puras (antes de las 19:00) — solo hay 2h
    // ordinarias diurnas disponibles, así que se descuentan las 0.5h ahí.
    const d = clasificarTurno(colombia('2026-01-05T17:00'), colombia('2026-01-05T19:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(1.5); // 2h - 0.5h almuerzo
    expect(Object.values(d).reduce((a, b) => a + b, 0)).toBeCloseTo(1.5, 5);
  });

  it('turno vacío o inválido (salida <= entrada) no lanza y devuelve todo en 0', () => {
    const d = clasificarTurno(colombia('2026-01-05T16:00'), colombia('2026-01-05T08:00'), sinFestivos);
    expect(Object.values(d).every((v) => v === 0)).toBe(true);
  });
});

describe('sumarDesgloses', () => {
  it('suma varios desgloses concepto por concepto (cada turno ya con su almuerzo descontado)', () => {
    const a = clasificarTurno(colombia('2026-01-05T08:00'), colombia('2026-01-05T16:00'), sinFestivos);
    const b = clasificarTurno(colombia('2026-01-06T08:00'), colombia('2026-01-06T16:00'), sinFestivos);
    const total = sumarDesgloses([a, b]);
    expect(total.diurnaOrdinaria).toBe(15); // 7.5h + 7.5h
  });
});

describe('calcularValorPorConcepto', () => {
  it('la hora extra diurna coincide con el valor de referencia confirmado (~$10.422)', () => {
    const desglose = clasificarTurno(colombia('2026-01-05T06:00'), colombia('2026-01-05T15:00'), sinFestivos); // 9h diurnas: 8 ordinarias + 1 extra
    const valores = calcularValorPorConcepto(desglose, VALOR_HORA, TASAS);
    expect(valores.extraDiurna).toBeCloseTo(10422.05, 1);
  });

  it('la hora extra nocturna coincide con el valor de referencia confirmado (~$14.591)', () => {
    // 8h diurnas ordinarias (6-14) + 1h nocturna... para aislar 1h extra nocturna, forzamos 9h nocturnas puras
    const desglose = clasificarTurno(colombia('2026-01-05T19:00'), colombia('2026-01-06T05:00'), sinFestivos); // 10h nocturnas: 8 ordinarias + 2 extra... ajustamos a 9h
    const valores = calcularValorPorConcepto(desglose, VALOR_HORA, TASAS);
    // 8h nocturnaOrdinaria + 2h extraNocturna en este caso — validamos el valor unitario, no el total
    const valorUnitarioExtraNocturna = valores.extraNocturna / desglose.extraNocturna;
    expect(valorUnitarioExtraNocturna).toBeCloseTo(14590.87, 0);
  });

  it('la diurna ordinaria no lleva recargo (es la base) — ya con el almuerzo descontado', () => {
    const desglose = clasificarTurno(colombia('2026-01-05T08:00'), colombia('2026-01-05T16:00'), sinFestivos);
    const valores = calcularValorPorConcepto(desglose, VALOR_HORA, TASAS);
    expect(valores.diurnaOrdinaria).toBeCloseTo(7.5 * VALOR_HORA, 2);
  });
});

describe('calcularTotalDevengadoHoras', () => {
  it('suma el valor de todos los conceptos', () => {
    const total = calcularTotalDevengadoHoras({
      diurnaOrdinaria: 100,
      nocturnaOrdinaria: 50,
      extraDiurna: 0,
      extraNocturna: 0,
      dominicalFestivaDiurna: 0,
      dominicalFestivaNocturna: 0,
      extraDiurnaDominicalFestiva: 0,
      extraNocturnaDominicalFestiva: 0,
    });
    expect(total).toBe(150);
  });
});

describe('calcularValorIncapacidad', () => {
  it('paga el 66.67% del salario diario (SMLV/30) por cada día de incapacidad', () => {
    // SMLV 1.750.905 / 30 = 58.363,5 por día; × 66.67% × 3 días
    const valor = calcularValorIncapacidad(1750905, 0.6667, 3);
    expect(valor).toBeCloseTo(116732.84, 1);
  });

  it('devuelve 0 si no hay días de incapacidad', () => {
    expect(calcularValorIncapacidad(1750905, 0.6667, 0)).toBe(0);
  });

  it('un solo día de incapacidad', () => {
    const valor = calcularValorIncapacidad(1750905, 0.6667, 1);
    expect(valor).toBeCloseTo(38910.95, 1);
  });
});

describe('calcularDeducciones', () => {
  it('reproduce el ejemplo de Carolina Duque (nómina manual de referencia, quincena sept. 2026)', () => {
    // Total devengado $1.175.000 (sin incapacidad ni recargos) -> EPS y
    // AFP de $47.000 cada una en la nómina manual.
    const d = calcularDeducciones(1175000, 0.04, 0.04);
    expect(d.deduccionEPS).toBe(47000);
    expect(d.deduccionAFP).toBe(47000);
    expect(d.totalDeducciones).toBe(94000);
  });

  it('reproduce el ejemplo de Daniel Aristizábal (con incapacidad y recargos)', () => {
    // Total devengado $952.023,744... -> EPS y AFP de $38.080,95 cada una.
    const d = calcularDeducciones(952023.744, 0.04, 0.04);
    expect(d.deduccionEPS).toBeCloseTo(38080.95, 1);
    expect(d.deduccionAFP).toBeCloseTo(38080.95, 1);
    expect(d.totalDeducciones).toBeCloseTo(76161.9, 1);
  });

  it('devuelve 0 si el total devengado es 0', () => {
    const d = calcularDeducciones(0, 0.04, 0.04);
    expect(d.totalDeducciones).toBe(0);
  });
});

describe('calcularAuxilioTransporte', () => {
  it('prorratea el auxilio mensual por días trabajados (30 días base)', () => {
    expect(calcularAuxilioTransporte(249095, 15)).toBeCloseTo(124547.5, 2);
  });

  it('devuelve 0 si no se trabajó ningún día', () => {
    expect(calcularAuxilioTransporte(249095, 0)).toBe(0);
  });
});
