import { describe, expect, it } from 'vitest';
import { calcularCMV } from './juego-inventarios.calculations.js';

describe('calcularCMV', () => {
  it('inicial + compras − inventario final físico/real', () => {
    expect(calcularCMV(1000000, 500000, 300000)).toBe(1200000);
  });

  it('a mayor inventario final físico, menor CMV (queda más mercancía sin vender/usar)', () => {
    expect(calcularCMV(1000000, 500000, 700000)).toBe(800000);
  });

  it('sin inventario inicial ni compras, el CMV es negativo del final (caso extremo)', () => {
    expect(calcularCMV(0, 0, 100000)).toBe(-100000);
  });
});
