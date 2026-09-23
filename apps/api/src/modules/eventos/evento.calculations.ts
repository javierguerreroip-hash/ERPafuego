// Fórmulas financieras del Módulo 3 (docs/spec_erp_afuego.md), extraídas
// como funciones puras para poder probarlas de forma aislada.

// Costo total del evento = suma de los subtotales de sus consumos.
export function calcularCostoTotal(consumos: { subtotal: number }[]): number {
  return round2(consumos.reduce((sum, c) => sum + c.subtotal, 0));
}

// Costo total como % sobre la venta (antes de impuestos).
export function calcularCostoPorcentaje(costoTotal: number, valorAntesImpuestos: number): number {
  if (valorAntesImpuestos <= 0) return 0;
  return round2((costoTotal / valorAntesImpuestos) * 100);
}

// Utilidad operacional = Valor venta (antes de impuestos) − Costos
// asociados. Se calcula sobre el valor ANTES de impuestos porque el IVA/
// impoconsumo cobrado no es ingreso real de la empresa (confirmado con el
// negocio).
export function calcularUtilidadOperacional(
  valorAntesImpuestos: number,
  costoTotal: number,
): { valor: number; porcentaje: number } {
  const valor = round2(valorAntesImpuestos - costoTotal);
  const porcentaje = valorAntesImpuestos > 0 ? round2((valor / valorAntesImpuestos) * 100) : 0;
  return { valor, porcentaje };
}

// Valor después de impuestos = Valor antes de impuestos × (1 + tasa).
// La tasa es un parámetro configurable (IVA 19%, IVA 5%, Impoconsumo 8%…).
export function calcularValorDespuesImpuestos(
  valorAntesImpuestos: number,
  taxRate: number,
): number {
  return round2(valorAntesImpuestos * (1 + taxRate));
}

// Subtotal de un consumo = cantidad × costo unitario.
export function calcularSubtotalConsumo(quantity: number, unitCost: number): number {
  return round2(quantity * unitCost);
}

// Costo unitario = promedio entre el último precio de compra del
// artículo y su costo unitario en el inventario inicial más reciente que
// se haya ingresado (pedido por el negocio: un solo precio de compra
// puede ser atípico, promediarlo con el inventario da un costo más
// real). Nace para el costo de un consumo de evento, pero se reutiliza
// igual en `inventario.service.ts` para el costo por defecto del
// Inventario Final Físico — es la misma pregunta ("¿qué costo uso
// cuando el operador no escribe uno?") en los dos casos. Casos
// especiales (ajustado 2026-09-24 — promediar con un "último precio de
// compra" de $0 cuando en realidad nunca hubo compra diluía el costo a
// la mitad de forma artificial, no reflejaba nada real):
// - Sin inventario inicial registrado: se usa solo el último precio de
//   compra (no hay con qué promediar).
// - Con inventario inicial pero SIN compras registradas todavía (último
//   precio de compra = $0, que en este sistema siempre significa "nunca
//   se compró" — ver ArticulosPage): se usa el costo del inventario
//   inicial tal cual, sin promediar contra ese $0 que no es un precio real.
// - Con inventario inicial Y con compras registradas (> $0): sí se
//   promedian los dos, como antes.
export function calcularCostoUnitarioPromedio(
  lastPurchasePrice: number,
  inventarioUnitCost: number | null,
): number {
  if (inventarioUnitCost === null) return round2(lastPurchasePrice);
  if (lastPurchasePrice === 0) return round2(inventarioUnitCost);
  return round2((lastPurchasePrice + inventarioUnitCost) / 2);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
