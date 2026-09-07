// Fórmula financiera del Módulo 4 (docs/spec_erp_afuego.md):
// Inventario final = Inventario inicial + Compras − Consumo.
// La misma fórmula aplica tanto en cantidad física (detalle por artículo)
// como en valor $ (consolidado general y futuro Módulo 8 — CMV).
export function calcularInventarioFinal(
  inventarioInicial: number,
  compras: number,
  consumo: number,
): number {
  return round2(inventarioInicial + compras - consumo);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
