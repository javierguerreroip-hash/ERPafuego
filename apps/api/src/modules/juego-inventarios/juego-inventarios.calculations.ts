import { calcularInventarioFinal } from '../inventario/inventario.calculations.js';

// CMV = Inventario inicial + Compras − Inventario final FÍSICO/real
// (docs/spec_erp_afuego.md). Es matemáticamente la misma fórmula que el
// "inventario final" del Módulo 4, pero aquí el término que resta es
// siempre el conteo físico de cierre — nunca el teórico (de sistema).
//
// Actualización post-lanzamiento (2026-09-24): antes existían un "CMV
// teórico" (con el inventario final de sistema) y un "CMV real" (con el
// físico), más la desviación entre los dos. Esa comparación se trasladó
// al módulo de Inventario (que ya calcula "inventario final teórico" y
// tiene el conteo físico) — aquí queda un solo CMV, calculado siempre con
// el físico/real, que es la definición contable que de verdad importa
// para costear lo vendido.
export function calcularCMV(
  inventarioInicial: number,
  compras: number,
  inventarioFinalFisico: number,
): number {
  return calcularInventarioFinal(inventarioInicial, compras, inventarioFinalFisico);
}
