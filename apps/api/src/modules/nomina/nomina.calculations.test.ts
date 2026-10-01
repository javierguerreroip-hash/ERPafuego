import { describe, expect, it } from 'vitest';
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
  type TasasRecargo,
  type TurnoConDesglose,
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

// Tope semanal de horas ordinarias (Art. 161 CST / Ley 2101 de 2021),
// agregado 2026-10-01 tras detectar que la liquidación solo revisaba el
// tope de 8h por turno, nunca el acumulado semanal — ver README.
describe('aplicarTopeSemanal', () => {
  function turno(fechaHoraLocal: string, desglose: Partial<ReturnType<typeof vacio>>): TurnoConDesglose {
    return { horaEntrada: colombia(fechaHoraLocal), desglose: { ...vacio(), ...desglose } };
  }
  function vacio() {
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

  it('una semana por debajo del tope no cambia nada', () => {
    // 5 turnos de 6.5h ordinarias (lunes a viernes) = 32.5h, bajo 42h.
    const turnos = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09'].map((f) =>
      turno(`${f}T08:00`, { diurnaOrdinaria: 6.5 }),
    );
    const resultado = aplicarTopeSemanal(turnos, 42);
    for (const t of resultado) {
      expect(t.desglose.diurnaOrdinaria).toBe(6.5);
      expect(t.desglose.extraDiurna).toBe(0);
    }
  });

  it('una semana que pasa el tope mueve el excedente al ÚLTIMO turno cronológico, no al primero', () => {
    // 6 turnos de 7.5h ordinarias (lunes a sábado) = 45h, 3h por encima
    // de un tope de 42h — el sábado (el último turno de la semana) debe
    // quedar con 4.5h ordinarias + 3h extra; los otros 5, sin tocar.
    const fechas = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10'];
    const turnos = fechas.map((f) => turno(`${f}T08:00`, { diurnaOrdinaria: 7.5 }));
    const resultado = aplicarTopeSemanal(turnos, 42);

    for (let i = 0; i < 5; i++) {
      expect(resultado[i].desglose.diurnaOrdinaria).toBe(7.5);
      expect(resultado[i].desglose.extraDiurna).toBe(0);
    }
    const sabado = resultado[5];
    expect(sabado.desglose.diurnaOrdinaria).toBe(4.5);
    expect(sabado.desglose.extraDiurna).toBe(3);

    const totalOrdinaria = resultado.reduce((s, t) => s + t.desglose.diurnaOrdinaria, 0);
    const totalExtra = resultado.reduce((s, t) => s + t.desglose.extraDiurna, 0);
    expect(totalOrdinaria).toBe(42);
    expect(totalExtra).toBe(3);
  });

  it('reparte el excedente proporcionalmente entre diurna y nocturna cuando el turno que cruza el tope tiene las dos', () => {
    // Turno A (lunes) ya "gasta" 40h de las 42h de la semana. Turno B
    // (martes) trae 2h diurnas + 2h nocturnas ordinarias — con solo 2h
    // de cupo semanal disponible, la mitad de cada una se vuelve extra.
    const turnoA = turno('2026-01-05T08:00', { diurnaOrdinaria: 40 });
    const turnoB = turno('2026-01-06T08:00', { diurnaOrdinaria: 2, nocturnaOrdinaria: 2 });
    const [a, b] = aplicarTopeSemanal([turnoA, turnoB], 42);

    expect(a.desglose.diurnaOrdinaria).toBe(40);
    expect(a.desglose.extraDiurna).toBe(0);
    expect(b.desglose.diurnaOrdinaria).toBe(1);
    expect(b.desglose.nocturnaOrdinaria).toBe(1);
    expect(b.desglose.extraDiurna).toBe(1);
    expect(b.desglose.extraNocturna).toBe(1);
  });

  it('nunca toca las horas dominicales/festivas, aunque la semana ya haya superado el tope', () => {
    const turnos = [
      ...['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10'].map((f) =>
        turno(`${f}T08:00`, { diurnaOrdinaria: 7.5 }),
      ),
      turno('2026-01-11T08:00', { dominicalFestivaDiurna: 7.5 }), // domingo
    ];
    const resultado = aplicarTopeSemanal(turnos, 42);
    const domingo = resultado[6];
    expect(domingo.desglose.dominicalFestivaDiurna).toBe(7.5);
    expect(domingo.desglose.extraDiurnaDominicalFestiva).toBe(0);
  });

  it('turnos de semanas distintas no se mezclan — cada semana calendario tiene su propio tope', () => {
    const lunesSemana1 = turno('2026-01-05T08:00', { diurnaOrdinaria: 40 });
    const lunesSemana2 = turno('2026-01-12T08:00', { diurnaOrdinaria: 40 }); // otra semana ISO
    const resultado = aplicarTopeSemanal([lunesSemana1, lunesSemana2], 42);
    expect(resultado[0].desglose.extraDiurna).toBe(0);
    expect(resultado[1].desglose.extraDiurna).toBe(0);
  });

  it('reconstruye la semana real del 21-26 de sept. 2026 que motivó este cambio: ~2h extra adicionales por el tope semanal', () => {
    // Mismos turnos exactos de la disputa de liquidación (ver captura
    // del usuario, 2026-10-01) — lunes a sábado, sin domingo.
    const datos: [string, string, string][] = [
      ['2026-01-05', '09:31:54', '17:00:10'], // se usan fechas de una semana cualquiera;
      ['2026-01-06', '09:12:44', '17:13:38'], // lo que importa es el patrón de horas,
      ['2026-01-07', '09:30:00', '17:00:00'], // no el año exacto de la disputa real.
      ['2026-01-08', '09:33:02', '17:00:39'],
      ['2026-01-09', '09:17:50', '18:01:22'],
      ['2026-01-10', '09:09:18', '17:01:40'],
    ];
    const sinFestivos2 = () => false;
    const turnosConDesglose: TurnoConDesglose[] = datos.map(([fecha, entrada, salida]) => ({
      horaEntrada: colombia(`${fecha}T${entrada.slice(0, 5)}`),
      desglose: clasificarTurno(
        colombia(`${fecha}T${entrada.slice(0, 5)}`),
        colombia(`${fecha}T${salida.slice(0, 5)}`),
        sinFestivos2,
      ),
    }));

    const antesDelTope = sumarDesgloses(turnosConDesglose.map((t) => t.desglose));
    // Antes del tope semanal, solo el martes (8.02h) y el viernes
    // (8.73h) generan algo de extra por el tope diario de 8h.
    expect(antesDelTope.extraDiurna).toBeCloseTo(0.75, 2);

    const conTope = aplicarTopeSemanal(turnosConDesglose, 42);
    const despuesDelTope = sumarDesgloses(conTope.map((t) => t.desglose));
    // Con el tope semanal de 42h, el sábado (último turno de la semana)
    // aporta 1.30h adicionales de extra — el total queda en 2.05h, no
    // los 0.75h que mostraba antes de este cambio.
    expect(despuesDelTope.extraDiurna).toBeCloseTo(2.05, 2);
    expect(despuesDelTope.diurnaOrdinaria).toBeCloseTo(42, 2);
  });
});

describe('limiteSemanasCompletas', () => {
  it('amplía el rango a la semana calendario completa (lunes a domingo) cuando el período no empieza ni termina en lunes', () => {
    // Quincena real de la disputa: 16 (miércoles) al 30 (miércoles) de
    // septiembre de 2026.
    const start = new Date('2026-09-16T00:00:00.000Z');
    const end = new Date('2026-09-30T23:59:59.999Z');
    const { desde, hasta } = limiteSemanasCompletas(start, end);
    expect(desde.toISOString().slice(0, 10)).toBe('2026-09-14'); // lunes
    expect(hasta.toISOString().slice(0, 10)).toBe('2026-10-04'); // domingo
  });

  it('no cambia nada si el período ya empieza en lunes y termina en domingo', () => {
    const start = new Date('2026-01-05T00:00:00.000Z'); // lunes
    const end = new Date('2026-01-11T23:59:59.999Z'); // domingo
    const { desde, hasta } = limiteSemanasCompletas(start, end);
    expect(desde.getTime()).toBe(start.getTime());
    expect(hasta.getTime()).toBe(end.getTime());
  });
});
