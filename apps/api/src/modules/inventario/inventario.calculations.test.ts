import { describe, expect, it } from 'vitest';
import { calcularDesviacionInventario, calcularInventarioFinal } from './inventario.calculations.js';

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
