import { describe, expect, it } from 'vitest';
import { calcularTotalGastosAdministrativos } from './gasto-administrativo.calculations.js';

describe('calcularTotalGastosAdministrativos', () => {
  it('suma los 9 rubros fijos', () => {
    const total = calcularTotalGastosAdministrativos({
      arriendo: 2000000,
      nomina: 3500000,
      serviciosPublicos: 500000,
      honorariosContadorSocios: 800000,
      controlPlagas: 120000,
      seguros: 250000,
      internet: 150000,
      adicionales: 100000,
      cuotaObligacionFinanciera: 600000,
    });
    expect(total).toBe(8020000);
  });

  it('devuelve 0 si todos los rubros están en 0', () => {
    const total = calcularTotalGastosAdministrativos({
      arriendo: 0,
      nomina: 0,
      serviciosPublicos: 0,
      honorariosContadorSocios: 0,
      controlPlagas: 0,
      seguros: 0,
      internet: 0,
      adicionales: 0,
      cuotaObligacionFinanciera: 0,
    });
    expect(total).toBe(0);
  });
});
