// Roles de usuario definidos en la especificación funcional
// (docs/spec_erp_afuego.md): Administrador/Gerencia, Operación,
// Cocina/Nómina y Ventas. Se comparten entre backend y frontend para
// evitar que los roles válidos queden duplicados/desincronizados.
// CONSULTA (post-lanzamiento, 2026-09-23): rol de solo lectura para
// externos (contador, socio...) — ve todos los módulos operativos y
// financieros, pero nunca puede crear/editar/eliminar nada, y no ve
// CRM, Agenda de Eventos, Opciones de Menú, Cotizaciones, Usuarios ni
// Auditoría (pedido explícito del negocio).
export const USER_ROLES = [
  'ADMINISTRADOR',
  'OPERACION',
  'COCINA_NOMINA',
  'VENTAS',
  'CONSULTA',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRADOR: 'Administrador/Gerencia',
  OPERACION: 'Operación',
  COCINA_NOMINA: 'Cocina/Nómina',
  VENTAS: 'Ventas',
  CONSULTA: 'Consulta externa (solo lectura)',
};

// Roles con acceso completo (crear/editar/eliminar) a los módulos
// operativos y financieros del negocio.
export const FULL_ACCESS_ROLES = ['ADMINISTRADOR', 'OPERACION', 'VENTAS'] as const;

// FULL_ACCESS_ROLES + CONSULTA — para las rutas de solo lectura (GET) de
// los módulos que el rol de consulta externa sí puede ver. CRM, Agenda,
// Opciones de Menú y Cotizaciones NO usan esta constante en sus rutas:
// siguen exclusivos de FULL_ACCESS_ROLES, ni siquiera en modo lectura.
export const READ_ACCESS_ROLES = [...FULL_ACCESS_ROLES, 'CONSULTA'] as const;
