import { calcularInventarioFinal } from '../inventario/inventario.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// CMV = Inventario inicial + Compras − Inventario final (docs/spec_erp_afuego.md).
// Es matemáticamente la misma fórmula que el "inventario final" del
// Módulo 4 — aquí el término que resta es el CMV teórico (inventario
// final "de sistema") o el CMV real (inventario final físico contado).
export function calcularCMV(
  inventarioInicial: number,
  compras: number,
  inventarioFinal: number,
): number {
  return calcularInventarioFinal(inventarioInicial, compras, inventarioFinal);
}

// Desviación entre el CMV real y el CMV teórico, en $ y en % relativo al
// teórico (qué tanto se desvió el real de lo esperado por sistema) — para
// identificar mermas, pérdidas o descuadres de inventario.
export function calcularDesviacionCMV(
  cmvReal: number,
  cmvTeorico: number,
): { valor: number; porcentaje: number } {
  const valor = round2(cmvReal - cmvTeorico);
  const porcentaje = cmvTeorico !== 0 ? round2((valor / Math.abs(cmvTeorico)) * 100) : 0;
  return { valor, porcentaje };
}
