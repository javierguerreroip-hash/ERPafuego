import { GASTO_ADMINISTRATIVO_RUBROS, type GastoAdministrativoInput } from '@erp-afuego/shared';

// Total de gastos administrativos del mes = suma de los rubros fijos
// (GASTO_ADMINISTRATIVO_RUBROS — actualmente 10, incluye Publicidad).
// Se aísla como función pura porque el futuro Estado de Resultados (Fase
// 8) la reutilizará directamente como uno de sus 5 pilares.
export function calcularTotalGastosAdministrativos(
  gasto: Pick<GastoAdministrativoInput, (typeof GASTO_ADMINISTRATIVO_RUBROS)[number]>,
): number {
  const total = GASTO_ADMINISTRATIVO_RUBROS.reduce((sum, rubro) => sum + gasto[rubro], 0);
  return Math.round((total + Number.EPSILON) * 100) / 100;
}
