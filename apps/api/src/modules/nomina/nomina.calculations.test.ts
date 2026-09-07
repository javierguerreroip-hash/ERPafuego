import { describe, expect, it } from 'vitest';
import {
  calcularAuxilioTransporte,
  calcularTotalDevengadoHoras,
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
  it('turno diurno de 8h en día ordinario: todo es diurna ordinaria', () => {
    const d = clasificarTurno(colombia('2026-01-05T08:00'), colombia('2026-01-05T16:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(8);
    expect(d.nocturnaOrdinaria).toBe(0);
    expect(d.extraDiurna).toBe(0);
  });

  it('turno que cruza a la noche (19:00) sin pasar de 8h: se reparte diurna/nocturna', () => {
    const d = clasificarTurno(colombia('2026-01-05T15:00'), colombia('2026-01-05T21:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(4); // 15:00-19:00
    expect(d.nocturnaOrdinaria).toBe(2); // 19:00-21:00
  });

  it('turno largo nocturno (10h) genera horas extra nocturnas tras el tope de 8h', () => {
    // 18:00 lunes -> 04:00 martes: 1h diurna (18-19) + 9h nocturna (19-04)
    const d = clasificarTurno(colombia('2026-01-05T18:00'), colombia('2026-01-06T04:00'), sinFestivos);
    expect(d.diurnaOrdinaria).toBe(1);
    expect(d.nocturnaOrdinaria).toBe(7); // 8h ordinarias - 1h diurna ya usada
    expect(d.extraNocturna).toBe(2); // 9h nocturnas - 7h ordinarias restantes
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(10, 5);
  });

  it('turno de 8h en domingo: todo es dominical/festiva diurna (sin extra)', () => {
    const d = clasificarTurno(colombia('2026-01-04T08:00'), colombia('2026-01-04T16:00'), sinFestivos);
    expect(d.dominicalFestivaDiurna).toBe(8);
    expect(d.diurnaOrdinaria).toBe(0);
  });

  it('turno de 10h en domingo: 8h dominical/festiva diurna + 2h extra dominical/festiva diurna', () => {
    const d = clasificarTurno(colombia('2026-01-04T07:00'), colombia('2026-01-04T17:00'), sinFestivos);
    expect(d.dominicalFestivaDiurna).toBe(8);
    expect(d.extraDiurnaDominicalFestiva).toBe(2);
  });

  it('día marcado como festivo (no domingo) se trata igual que un domingo', () => {
    const esFestivo = (fecha: string) => fecha === '2026-01-06';
    const d = clasificarTurno(colombia('2026-01-06T08:00'), colombia('2026-01-06T16:00'), esFestivo);
    expect(d.dominicalFestivaDiurna).toBe(8);
  });

  it('turno vacío o inválido (salida <= entrada) no lanza y devuelve todo en 0', () => {
    const d = clasificarTurno(colombia('2026-01-05T16:00'), colombia('2026-01-05T08:00'), sinFestivos);
    expect(Object.values(d).every((v) => v === 0)).toBe(true);
  });
});

describe('sumarDesgloses', () => {
  it('suma varios desgloses concepto por concepto', () => {
    const a = clasificarTurno(colombia('2026-01-05T08:00'), colombia('2026-01-05T16:00'), sinFestivos);
    const b = clasificarTurno(colombia('2026-01-06T08:00'), colombia('2026-01-06T16:00'), sinFestivos);
    const total = sumarDesgloses([a, b]);
    expect(total.diurnaOrdinaria).toBe(16);
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

  it('la diurna ordinaria no lleva recargo (es la base)', () => {
    const desglose = clasificarTurno(colombia('2026-01-05T08:00'), colombia('2026-01-05T16:00'), sinFestivos);
    const valores = calcularValorPorConcepto(desglose, VALOR_HORA, TASAS);
    expect(valores.diurnaOrdinaria).toBeCloseTo(8 * VALOR_HORA, 2);
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

describe('calcularAuxilioTransporte', () => {
  it('prorratea el auxilio mensual por días trabajados (30 días base)', () => {
    expect(calcularAuxilioTransporte(249095, 15)).toBeCloseTo(124547.5, 2);
  });

  it('devuelve 0 si no se trabajó ningún día', () => {
    expect(calcularAuxilioTransporte(249095, 0)).toBe(0);
  });
});
