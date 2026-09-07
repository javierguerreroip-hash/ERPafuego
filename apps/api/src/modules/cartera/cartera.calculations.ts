import type { EstadoCartera } from '@erp-afuego/shared';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toDateOnlyUTC(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Saldo pendiente (docs/spec_erp_afuego.md):
// CxC = Valor total facturado − Anticipo − Abonos.
// CxP = Valor de la factura − Abonos.
// Misma fórmula (valorTotal − deducciones) para ambas — solo cambia qué
// se pasa como deducciones.
export function calcularSaldoPendiente(valorTotal: number, deducciones: number): number {
  return round2(valorTotal - deducciones);
}

// Estado siempre calculado, nunca editable manualmente. "Vencida" solo
// aplica si todavía hay saldo Y la fecha de vencimiento ya pasó — se
// compara a nivel de día completo (un vencimiento hoy mismo NO cuenta
// como vencido todavía).
export function calcularEstadoCartera(
  saldoPendiente: number,
  fechaVencimiento: Date,
  hoy: Date = new Date(),
): EstadoCartera {
  if (saldoPendiente <= 0) return 'PAGADA';
  if (toDateOnlyUTC(hoy) > toDateOnlyUTC(fechaVencimiento)) return 'VENCIDA';
  return 'PENDIENTE';
}
