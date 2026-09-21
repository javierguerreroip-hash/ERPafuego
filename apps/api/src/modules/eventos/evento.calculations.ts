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

// Costo unitario de un consumo = promedio entre el último precio de
// compra del artículo y su costo unitario en el inventario inicial más
// reciente que se haya ingresado (pedido por el negocio: un solo precio
// de compra puede ser atípico, promediarlo con el inventario da un costo
// más real). Si el artículo nunca tuvo inventario inicial registrado, se
// usa solo el último precio de compra — no hay con qué promediar.
export function calcularCostoUnitarioPromedio(
  lastPurchasePrice: number,
  inventarioUnitCost: number | null,
): number {
  if (inventarioUnitCost === null) return round2(lastPurchasePrice);
  return round2((lastPurchasePrice + inventarioUnitCost) / 2);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
