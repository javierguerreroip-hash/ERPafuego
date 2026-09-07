import { describe, expect, it } from 'vitest';
import { calcularCMV, calcularDesviacionCMV } from './juego-inventarios.calculations.js';

describe('calcularCMV', () => {
  it('CMV teórico: inicial + compras − inventario final de sistema', () => {
    expect(calcularCMV(1000000, 500000, 300000)).toBe(1200000);
  });

  it('CMV real: inicial + compras − inventario final físico (puede diferir del teórico)', () => {
    expect(calcularCMV(1000000, 500000, 250000)).toBe(1250000);
  });

  it('sin inventario inicial ni compras, el CMV es negativo del final (caso extremo)', () => {
    expect(calcularCMV(0, 0, 100000)).toBe(-100000);
  });
});

describe('calcularDesviacionCMV', () => {
  it('CMV real mayor al teórico → desviación positiva (posible merma/pérdida)', () => {
    const result = calcularDesviacionCMV(1250000, 1200000);
    expect(result.valor).toBe(50000);
    expect(result.porcentaje).toBeCloseTo(4.17, 1);
  });

  it('CMV real menor al teórico → desviación negativa', () => {
    const result = calcularDesviacionCMV(1100000, 1200000);
    expect(result.valor).toBe(-100000);
    expect(result.porcentaje).toBeCloseTo(-8.33, 1);
  });

  it('sin desviación cuando real y teórico coinciden', () => {
    const result = calcularDesviacionCMV(1200000, 1200000);
    expect(result.valor).toBe(0);
    expect(result.porcentaje).toBe(0);
  });

  it('devuelve 0% cuando el CMV teórico es 0 (evita división por cero)', () => {
    const result = calcularDesviacionCMV(50000, 0);
    expect(result.valor).toBe(50000);
    expect(result.porcentaje).toBe(0);
  });
});
