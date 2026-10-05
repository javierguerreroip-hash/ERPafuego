import { describe, expect, it } from 'vitest';
import { calcularCostoMenu, sugerirIngredientes } from './opcion-menu.calculations.js';

describe('calcularCostoMenu', () => {
  it('suma cantidad × costo unitario de cada ingrediente', () => {
    // 0.16 kg de punta de anca a 38.000 + 0.2 kg de papa a 3.000 + 0.03 L de aceite a 22.000
    const costo = calcularCostoMenu([
      { cantidad: 0.16, costoUnitario: 38000 },
      { cantidad: 0.2, costoUnitario: 3000 },
      { cantidad: 0.03, costoUnitario: 22000 },
    ]);
    expect(costo).toBe(7340);
  });

  it('redondea el subtotal de cada línea a 2 decimales, igual que un consumo de evento', () => {
    // 0.333 × 1.005 = 0.334665 → 0.33 por línea; dos líneas → 0.66
    const costo = calcularCostoMenu([
      { cantidad: 0.333, costoUnitario: 1.005 },
      { cantidad: 0.333, costoUnitario: 1.005 },
    ]);
    expect(costo).toBe(0.66);
  });

  it('devuelve 0 cuando el menú no tiene ingredientes', () => {
    expect(calcularCostoMenu([])).toBe(0);
  });
});

describe('sugerirIngredientes', () => {
  const articulos = [
    { id: 'a1', name: 'Punta de Anca' },
    { id: 'a2', name: 'Lechuga' },
    { id: 'a3', name: 'Tomate Cherry' },
    { id: 'a4', name: 'Papa' },
    { id: 'a5', name: 'Aceite de Oliva' },
    { id: 'a6', name: 'Tocineta' },
  ];

  it('encuentra artículos mencionados sin importar tildes, mayúsculas o plural', () => {
    const sugeridos = sugerirIngredientes(
      'Fuerte: PUNTA DE ANCA 200gr, mezclum de lechugas, tomate cherry y papas provenzales.',
      articulos,
    );
    expect(sugeridos).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('exige que todas las palabras significativas del nombre aparezcan', () => {
    // "tomate" solo aparece, pero el artículo es "Tomate Cherry".
    expect(sugerirIngredientes('Ensalada con tomate y papa.', articulos)).toEqual(['a4']);
  });

  it('devuelve vacío cuando la descripción no menciona ningún artículo', () => {
    expect(
      sugerirIngredientes('Variante de menú del día (composición pendiente de detallar).', articulos),
    ).toEqual([]);
  });

  it('devuelve vacío con descripción vacía', () => {
    expect(sugerirIngredientes('', articulos)).toEqual([]);
  });
});
