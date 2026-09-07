import { describe, expect, it } from 'vitest';
import { calcularUtilidadNeta } from './estado-resultados.calculations.js';

describe('calcularUtilidadNeta', () => {
  it('ingreso total − CMV − gastos de venta − gastos administrativos', () => {
    const result = calcularUtilidadNeta(10000000, 3000000, 2000000, 1500000);
    expect(result.valor).toBe(3500000);
    expect(result.porcentaje).toBe(35);
  });

  it('puede dar utilidad neta negativa (pérdida del período)', () => {
    const result = calcularUtilidadNeta(5000000, 3000000, 2000000, 1500000);
    expect(result.valor).toBe(-1500000);
    expect(result.porcentaje).toBe(-30);
  });

  it('devuelve 0% cuando el ingreso total es 0 (evita división por cero)', () => {
    const result = calcularUtilidadNeta(0, 0, 0, 500000);
    expect(result.valor).toBe(-500000);
    expect(result.porcentaje).toBe(0);
  });

  it('sin ningún costo ni gasto, la utilidad neta es igual al ingreso total', () => {
    const result = calcularUtilidadNeta(2000000, 0, 0, 0);
    expect(result.valor).toBe(2000000);
    expect(result.porcentaje).toBe(100);
  });
});
