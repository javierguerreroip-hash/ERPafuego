// Roles de usuario definidos en la especificación funcional
// (docs/spec_erp_afuego.md): Administrador/Gerencia, Operación,
// Cocina/Nómina y Ventas. Se comparten entre backend y frontend para
// evitar que los roles válidos queden duplicados/desincronizados.
export const USER_ROLES = ['ADMINISTRADOR', 'OPERACION', 'COCINA_NOMINA', 'VENTAS'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRADOR: 'Administrador/Gerencia',
  OPERACION: 'Operación',
  COCINA_NOMINA: 'Cocina/Nómina',
  VENTAS: 'Ventas',
};
