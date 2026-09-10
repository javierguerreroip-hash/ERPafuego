import type { CotizacionLineaInput, CotizacionTotales } from '@erp-afuego/shared';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumaLineas(lineas: CotizacionLineaInput[]): number {
  return round2(lineas.reduce((sum, linea) => sum + linea.cantidad * linea.valorUnitario, 0));
}

// Totales de una cotización: subtotal = ítems del menú + logística;
// impuesto = subtotal × tasa (0 si no se eligió tasa); total = subtotal +
// impuesto. Se aísla como función pura porque alimenta tanto la pantalla
// como el PDF exportado, y deben coincidir siempre.
export function calcularTotalesCotizacion(
  items: CotizacionLineaInput[],
  logistica: CotizacionLineaInput[],
  impuestoPorcentaje: number,
): CotizacionTotales {
  const subtotalItems = sumaLineas(items);
  const subtotalLogistica = sumaLineas(logistica);
  const subtotal = round2(subtotalItems + subtotalLogistica);
  const impuestoValor = round2(subtotal * impuestoPorcentaje);
  const total = round2(subtotal + impuestoValor);
  return { subtotalItems, subtotalLogistica, subtotal, impuestoValor, impuestoPorcentaje, total };
}
