import { describe, expect, it } from 'vitest';
import { calcularEstadoAnticipo, calcularSaldoPendiente } from './agenda.calculations.js';

describe('calcularSaldoPendiente', () => {
  it('valor antes de impuestos − anticipo', () => {
    expect(calcularSaldoPendiente(1000000, 300000)).toBe(700000);
  });

  it('sin anticipo, el saldo es igual al valor total', () => {
    expect(calcularSaldoPendiente(1000000, 0)).toBe(1000000);
  });

  it('anticipo igual al valor total: saldo 0', () => {
    expect(calcularSaldoPendiente(1000000, 1000000)).toBe(0);
  });
});

describe('calcularEstadoAnticipo', () => {
  it('sin anticipo', () => {
    expect(calcularEstadoAnticipo(1000000, 0)).toBe('SIN_ANTICIPO');
  });

  it('anticipo parcial → saldo pendiente', () => {
    expect(calcularEstadoAnticipo(1000000, 300000)).toBe('SALDO_PENDIENTE');
  });

  it('anticipo igual al valor total → pagado', () => {
    expect(calcularEstadoAnticipo(1000000, 1000000)).toBe('ANTICIPO_PAGADO');
  });

  it('anticipo mayor al valor total (sobrepago) → pagado', () => {
    expect(calcularEstadoAnticipo(1000000, 1200000)).toBe('ANTICIPO_PAGADO');
  });
});
