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

// Encadenamiento de períodos (post-lanzamiento, 2026-10-05): el inventario
// final físico de cierre de un mes es el inventario inicial del mes
// siguiente. Si `fecha` (medianoche UTC, igual que se guarda) es el ÚLTIMO
// día de un mes, devuelve el día siguiente (el 1 del mes que sigue), que es
// la fecha en la que se guarda el inicial; si no es fin de mes, devuelve
// null (un conteo a mitad de mes no abre un período nuevo).
export function fechaInicialDelMesSiguiente(fecha: Date): Date | null {
  const siguiente = new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate() + 1),
  );
  return siguiente.getUTCDate() === 1 ? siguiente : null;
}

// Plazo para cargar/corregir el cierre de un mes: hasta `diasPlazo` días
// después de su último día (inclusive). Solo aplica cuando `fechaFin` es el
// último día de un mes; para cualquier otra fecha devuelve null. `hoy` debe
// venir ya expresado en hora de Colombia (con getters UTC).
export function plazoCierreMes(
  fechaFin: Date,
  hoy: Date,
  diasPlazo: number,
): { hasta: Date; vencido: boolean } | null {
  if (fechaInicialDelMesSiguiente(fechaFin) === null) return null;
  const hasta = new Date(
    Date.UTC(fechaFin.getUTCFullYear(), fechaFin.getUTCMonth(), fechaFin.getUTCDate() + diasPlazo),
  );
  const hoyDia = new Date(
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()),
  );
  return { hasta, vencido: hoyDia > hasta };
}
