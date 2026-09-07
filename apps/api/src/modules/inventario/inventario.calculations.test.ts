import { describe, expect, it } from 'vitest';
import { calcularInventarioFinal } from './inventario.calculations.js';

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
