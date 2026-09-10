import { z } from 'zod';

// Módulo de Gastos Administrativos (docs/spec_erp_afuego.md): registro
// mensual de rubros fijos. Un solo registro por (año, mes) — no es un
// catálogo abierto como Articulo, son los rubros exactos que pide la
// especificación. Alimenta el futuro Estado de Resultados.
export const GASTO_ADMINISTRATIVO_RUBROS = [
  'arriendo',
  'nomina',
  'serviciosPublicos',
  'honorariosContadorSocios',
  'controlPlagas',
  'seguros',
  'internet',
  'adicionales',
  'cuotaObligacionFinanciera',
  'publicidad',
  'lavanderia',
] as const;

export type GastoAdministrativoRubro = (typeof GASTO_ADMINISTRATIVO_RUBROS)[number];

export const GASTO_ADMINISTRATIVO_RUBRO_LABELS: Record<GastoAdministrativoRubro, string> = {
  arriendo: 'Arriendo',
  nomina: 'Nómina (administrativa)',
  serviciosPublicos: 'Servicios públicos',
  honorariosContadorSocios: 'Honorarios de contador y socios',
  controlPlagas: 'Control de plagas',
  seguros: 'Seguros',
  internet: 'Internet',
  adicionales: 'Adicionales',
  cuotaObligacionFinanciera: 'Cuota de obligación financiera',
  publicidad: 'Publicidad',
  lavanderia: 'Lavandería',
};

const nonNegative = () => z.number().nonnegative('El valor no puede ser negativo').default(0);

export const gastoAdministrativoSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  arriendo: nonNegative(),
  nomina: nonNegative(),
  serviciosPublicos: nonNegative(),
  honorariosContadorSocios: nonNegative(),
  controlPlagas: nonNegative(),
  seguros: nonNegative(),
  internet: nonNegative(),
  adicionales: nonNegative(),
  cuotaObligacionFinanciera: nonNegative(),
  publicidad: nonNegative(),
  lavanderia: nonNegative(),
});

export type GastoAdministrativoInput = z.infer<typeof gastoAdministrativoSchema>;

export interface GastoAdministrativoDTO extends GastoAdministrativoInput {
  id: string;
  total: number;
  registeredByName: string;
  createdAt: string;
  updatedAt: string;
}
