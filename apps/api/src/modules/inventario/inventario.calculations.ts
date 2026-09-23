// Fórmula financiera del Módulo 4 (docs/spec_erp_afuego.md):
// Inventario final TEÓRICO (de sistema) = Inventario inicial + Compras −
// Consumo. La misma fórmula aplica tanto en cantidad física (detalle por
// artículo) como en valor $ (consolidado general y el módulo Juego de
// Inventarios — CMV).
export function calcularInventarioFinal(
  inventarioInicial: number,
  compras: number,
  consumo: number,
): number {
  return round2(inventarioInicial + compras - consumo);
}

// Desviación entre el inventario final FÍSICO (conteo manual de cierre)
// y el TEÓRICO (post-lanzamiento, 2026-09-24) — positiva = hay más de lo
// que el sistema esperaba, negativa = merma/pérdida frente a lo esperado.
export function calcularDesviacionInventario(
  inventarioFinalFisico: number,
  inventarioFinalTeorico: number,
): number {
  return round2(inventarioFinalFisico - inventarioFinalTeorico);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
