import { describe, expect, it } from 'vitest';
import { calcularEstadoCartera, calcularSaldoPendiente } from './cartera.calculations.js';

describe('calcularSaldoPendiente', () => {
  it('CxC: valor facturado − anticipo − abonos', () => {
    expect(calcularSaldoPendiente(1000000, 300000 + 200000)).toBe(500000);
  });

  it('CxP: valor de la factura − abonos', () => {
    expect(calcularSaldoPendiente(500000, 500000)).toBe(0);
  });

  it('puede quedar en negativo si hay sobrepago (no se fuerza a 0)', () => {
    expect(calcularSaldoPendiente(500000, 600000)).toBe(-100000);
  });
});

describe('calcularEstadoCartera', () => {
  const hoy = new Date('2026-06-15T12:00:00Z');

  it('saldo en 0 → Pagada, sin importar la fecha de vencimiento', () => {
    const vencimientoPasado = new Date('2026-01-01T00:00:00Z');
    expect(calcularEstadoCartera(0, vencimientoPasado, hoy)).toBe('PAGADA');
  });

  it('saldo negativo (sobrepago) → Pagada', () => {
    expect(calcularEstadoCartera(-500, new Date('2026-01-01T00:00:00Z'), hoy)).toBe('PAGADA');
  });

  it('con saldo y vencimiento futuro → Pendiente', () => {
    const vencimientoFuturo = new Date('2026-07-01T00:00:00Z');
    expect(calcularEstadoCartera(500000, vencimientoFuturo, hoy)).toBe('PENDIENTE');
  });

  it('con saldo y vencimiento ya pasado → Vencida', () => {
    const vencimientoPasado = new Date('2026-05-01T00:00:00Z');
    expect(calcularEstadoCartera(500000, vencimientoPasado, hoy)).toBe('VENCIDA');
  });

  it('vencimiento es HOY mismo → todavía no cuenta como vencida', () => {
    const vencimientoHoy = new Date('2026-06-15T00:00:00Z');
    expect(calcularEstadoCartera(500000, vencimientoHoy, hoy)).toBe('PENDIENTE');
  });

  it('vencimiento fue ayer → ya es vencida', () => {
    const vencimientoAyer = new Date('2026-06-14T00:00:00Z');
    expect(calcularEstadoCartera(500000, vencimientoAyer, hoy)).toBe('VENCIDA');
  });
});
