import { describe, expect, it } from 'vitest';
import {
  calcularDesviacionInventario,
  calcularInventarioFinal,
  elegirConteoVigente,
  fechaInicialDelMesSiguiente,
  plazoCierreMes,
} from './inventario.calculations.js';

describe('calcularInventarioFinal', () => {
  it('inicial + compras - consumo', () => {
    expect(calcularInventarioFinal(100, 50, 30)).toBe(120);
  });

  it('funciona en $ igual que en cantidad física (misma fórmula)', () => {
    expect(calcularInventarioFinal(500000, 200000, 150000)).toBe(550000);
  });

  it('sin inventario inicial registrado (0) y sin compras, solo resta el consumo', () => {
    expect(calcularInventarioFinal(0, 0, 40)).toBe(-40);
  });

  it('sin ningún movimiento, el final es igual al inicial', () => {
    expect(calcularInventarioFinal(75, 0, 0)).toBe(75);
  });

  it('redondea a 2 decimales', () => {
    expect(calcularInventarioFinal(10.005, 10.005, 0)).toBe(20.01);
  });
});

describe('calcularDesviacionInventario', () => {
  it('físico mayor al teórico → desviación positiva (sobra frente a lo esperado)', () => {
    expect(calcularDesviacionInventario(120, 100)).toBe(20);
  });

  it('físico menor al teórico → desviación negativa (merma/pérdida)', () => {
    expect(calcularDesviacionInventario(80, 100)).toBe(-20);
  });

  it('sin desviación cuando físico y teórico coinciden', () => {
    expect(calcularDesviacionInventario(100, 100)).toBe(0);
  });

  it('redondea a 2 decimales', () => {
    expect(calcularDesviacionInventario(10.005, 0)).toBe(10.01);
  });
});

describe('fechaInicialDelMesSiguiente', () => {
  it('devuelve el 1 del mes siguiente cuando la fecha es fin de mes', () => {
    const r = fechaInicialDelMesSiguiente(new Date('2026-09-30T00:00:00.000Z'));
    expect(r?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('cruza el año en diciembre', () => {
    const r = fechaInicialDelMesSiguiente(new Date('2026-12-31T00:00:00.000Z'));
    expect(r?.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('respeta febrero (año bisiesto y no bisiesto)', () => {
    expect(fechaInicialDelMesSiguiente(new Date('2028-02-29T00:00:00.000Z'))?.toISOString()).toBe(
      '2028-03-01T00:00:00.000Z',
    );
    expect(fechaInicialDelMesSiguiente(new Date('2027-02-28T00:00:00.000Z'))?.toISOString()).toBe(
      '2027-03-01T00:00:00.000Z',
    );
    expect(fechaInicialDelMesSiguiente(new Date('2028-02-28T00:00:00.000Z'))).toBeNull();
  });

  it('devuelve null si la fecha no es el último día del mes', () => {
    expect(fechaInicialDelMesSiguiente(new Date('2026-09-29T00:00:00.000Z'))).toBeNull();
    expect(fechaInicialDelMesSiguiente(new Date('2026-09-01T00:00:00.000Z'))).toBeNull();
  });
});

describe('elegirConteoVigente', () => {
  it('usa el conteo 2 cuando existe, aunque también haya conteo 1', () => {
    const r = elegirConteoVigente([
      { conteo: 1, quantity: 10 },
      { conteo: 2, quantity: 12 },
    ]);
    expect(r?.quantity).toBe(12);
  });

  it('usa el conteo 1 (provisional) cuando todavía no hay conteo 2', () => {
    expect(elegirConteoVigente([{ conteo: 1, quantity: 10 }])?.quantity).toBe(10);
  });

  it('devuelve undefined si no hay conteos', () => {
    expect(elegirConteoVigente([])).toBeUndefined();
  });
});

describe('plazoCierreMes', () => {
  const finSeptiembre = new Date('2026-09-30T00:00:00.000Z');

  it('permite hasta 7 días después del fin de mes, inclusive', () => {
    const plazo = plazoCierreMes(finSeptiembre, new Date('2026-10-07T03:00:00.000Z'), 7);
    expect(plazo?.hasta.toISOString()).toBe('2026-10-07T00:00:00.000Z');
    expect(plazo?.vencido).toBe(false);
  });

  it('vence el día 8', () => {
    const plazo = plazoCierreMes(finSeptiembre, new Date('2026-10-08T00:00:00.000Z'), 7);
    expect(plazo?.vencido).toBe(true);
  });

  it('no está vencido durante el mismo mes', () => {
    expect(plazoCierreMes(finSeptiembre, new Date('2026-09-25T12:00:00.000Z'), 7)?.vencido).toBe(false);
  });

  it('cruza de mes correctamente (cierre de diciembre)', () => {
    const plazo = plazoCierreMes(new Date('2026-12-31T00:00:00.000Z'), new Date('2027-01-05T00:00:00.000Z'), 7);
    expect(plazo?.hasta.toISOString()).toBe('2027-01-07T00:00:00.000Z');
    expect(plazo?.vencido).toBe(false);
  });

  it('devuelve null si la fecha no es fin de mes', () => {
    expect(plazoCierreMes(new Date('2026-09-15T00:00:00.000Z'), new Date('2026-10-20T00:00:00.000Z'), 7)).toBeNull();
  });
});
