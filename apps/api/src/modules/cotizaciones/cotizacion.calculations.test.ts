import { describe, expect, it } from 'vitest';
import { calcularTotalesCotizacion } from './cotizacion.calculations.js';

describe('calcularTotalesCotizacion', () => {
  it('reproduce el ejemplo de la plantilla (Paella Marinera, 20 personas)', () => {
    const totales = calcularTotalesCotizacion(
      [{ descripcion: 'Paella Marinera', cantidad: 20, valorUnitario: 80000 }],
      [
        { descripcion: 'Cocinero experto', cantidad: 1, valorUnitario: 180000 },
        { descripcion: 'Transporte del evento', cantidad: 1, valorUnitario: 60000 },
      ],
      0.08,
    );
    expect(totales.subtotalItems).toBe(1600000);
    expect(totales.subtotalLogistica).toBe(240000);
    expect(totales.subtotal).toBe(1840000);
    expect(totales.impuestoValor).toBe(147200);
    expect(totales.total).toBe(1987200);
  });

  it('sin tasa de impuesto, el impuesto es 0 y el total = subtotal', () => {
    const totales = calcularTotalesCotizacion(
      [{ descripcion: 'Menú infantil', cantidad: 10, valorUnitario: 25000 }],
      [],
      0,
    );
    expect(totales.subtotal).toBe(250000);
    expect(totales.impuestoValor).toBe(0);
    expect(totales.total).toBe(250000);
  });

  it('suma varios ítems y varias líneas de logística', () => {
    const totales = calcularTotalesCotizacion(
      [
        { descripcion: 'Parrilla 9 Momentos', cantidad: 30, valorUnitario: 90000 },
        { descripcion: 'Sánduche Burrata', cantidad: 30, valorUnitario: 25000 },
      ],
      [
        { descripcion: 'Meseros (3)', cantidad: 3, valorUnitario: 150000 },
        { descripcion: 'Montaje de mesa', cantidad: 1, valorUnitario: 150000 },
      ],
      0.19,
    );
    expect(totales.subtotalItems).toBe(3450000);
    expect(totales.subtotalLogistica).toBe(600000);
    expect(totales.subtotal).toBe(4050000);
    expect(totales.impuestoValor).toBe(769500);
    expect(totales.total).toBe(4819500);
  });
});
