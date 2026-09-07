function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Utilidad neta = Ingreso total − CMV − Gastos de venta − Gastos
// administrativos (docs/spec_erp_afuego.md), en $ y en % sobre la venta.
export function calcularUtilidadNeta(
  ingresoTotal: number,
  cmv: number,
  gastosVenta: number,
  gastosAdministrativos: number,
): { valor: number; porcentaje: number } {
  const valor = round2(ingresoTotal - cmv - gastosVenta - gastosAdministrativos);
  const porcentaje = ingresoTotal > 0 ? round2((valor / ingresoTotal) * 100) : 0;
  return { valor, porcentaje };
}
