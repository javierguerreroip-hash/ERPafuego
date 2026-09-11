import { describe, expect, it } from 'vitest';
import { calcularEficienciaComercial } from './negocio.calculations.js';

describe('calcularEficienciaComercial', () => {
  it('reproduce el ejemplo confirmado con el usuario (4M ganado de 10M cotizado -> 40%)', () => {
    expect(calcularEficienciaComercial(4_000_000, 10_000_000)).toBe(40);
  });

  it('devuelve 0 si todavía no se ha cotizado nada en el período', () => {
    expect(calcularEficienciaComercial(0, 0)).toBe(0);
  });

  it('redondea a 1 decimal', () => {
    expect(calcularEficienciaComercial(1_000_000, 3_000_000)).toBe(33.3);
  });

  it('puede llegar a 100% si todo lo cotizado se ganó', () => {
    expect(calcularEficienciaComercial(5_000_000, 5_000_000)).toBe(100);
  });
});
