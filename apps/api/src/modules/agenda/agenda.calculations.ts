import type { EstadoAnticipo } from '@erp-afuego/shared';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Saldo pendiente = Valor antes de impuestos − Anticipo (docs/spec_erp_afuego.md).
export function calcularSaldoPendiente(valorAntesImpuestos: number, anticipo: number): number {
  return round2(valorAntesImpuestos - anticipo);
}

export function calcularEstadoAnticipo(valorAntesImpuestos: number, anticipo: number): EstadoAnticipo {
  if (anticipo <= 0) return 'SIN_ANTICIPO';
  if (anticipo >= valorAntesImpuestos) return 'ANTICIPO_PAGADO';
  return 'SALDO_PENDIENTE';
}
