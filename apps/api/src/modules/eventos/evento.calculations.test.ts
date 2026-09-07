import { describe, expect, it } from 'vitest';
import {
  calcularCostoPorcentaje,
  calcularCostoTotal,
  calcularSubtotalConsumo,
  calcularUtilidadOperacional,
  calcularValorDespuesImpuestos,
} from './evento.calculations.js';

describe('calcularCostoTotal', () => {
  it('suma los subtotales de todos los consumos', () => {
    expect(
      calcularCostoTotal([{ subtotal: 100000 }, { subtotal: 50000 }, { subtotal: 25000 }]),
    ).toBe(175000);
  });

  it('devuelve 0 cuando el evento no tiene consumos cargados', () => {
    expect(calcularCostoTotal([])).toBe(0);
  });

  it('redondea a 2 decimales', () => {
    expect(calcularCostoTotal([{ subtotal: 10.005 }, { subtotal: 10.005 }])).toBe(20.01);
  });
});

describe('calcularCostoPorcentaje', () => {
  it('calcula el costo como % de la venta', () => {
    expect(calcularCostoPorcentaje(40000, 100000)).toBe(40);
  });

  it('devuelve 0 si la venta es 0 (evita división por cero)', () => {
    expect(calcularCostoPorcentaje(1000, 0)).toBe(0);
  });
});

describe('calcularUtilidadOperacional', () => {
  it('calcula utilidad = venta antes de impuestos - costos, en $ y %', () => {
    const result = calcularUtilidadOperacional(100000, 40000);
    expect(result.valor).toBe(60000);
    expect(result.porcentaje).toBe(60);
  });

  it('puede dar utilidad negativa (pérdida) si los costos superan la venta', () => {
    const result = calcularUtilidadOperacional(50000, 80000);
    expect(result.valor).toBe(-30000);
    expect(result.porcentaje).toBe(-60);
  });

  it('devuelve 0% si la venta antes de impuestos es 0', () => {
    const result = calcularUtilidadOperacional(0, 0);
    expect(result.valor).toBe(0);
    expect(result.porcentaje).toBe(0);
  });
});

describe('calcularValorDespuesImpuestos', () => {
  it('aplica IVA del 19%', () => {
    expect(calcularValorDespuesImpuestos(100000, 0.19)).toBe(119000);
  });

  it('aplica IVA del 5%', () => {
    expect(calcularValorDespuesImpuestos(100000, 0.05)).toBe(105000);
  });

  it('aplica Impuesto al Consumo del 8%', () => {
    expect(calcularValorDespuesImpuestos(100000, 0.08)).toBe(108000);
  });

  it('sin tasa de impuesto (0), el valor no cambia', () => {
    expect(calcularValorDespuesImpuestos(100000, 0)).toBe(100000);
  });
});

describe('calcularSubtotalConsumo', () => {
  it('multiplica cantidad × costo unitario', () => {
    expect(calcularSubtotalConsumo(3, 15000)).toBe(45000);
  });

  it('funciona con cantidades fraccionarias (kg, litros, etc.)', () => {
    expect(calcularSubtotalConsumo(2.5, 8000)).toBe(20000);
  });

  it('devuelve 0 si el artículo aún no tiene precio de compra registrado', () => {
    expect(calcularSubtotalConsumo(10, 0)).toBe(0);
  });
});
