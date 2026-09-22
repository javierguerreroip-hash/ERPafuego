// Historial de auditoría (post-lanzamiento, 2026-09-22) — solo lo puede
// consultar Administrador (ver auditoria.routes.ts). Cubre los maestros
// y parámetros de configuración que no dejaban rastro de quién los
// editaba (a diferencia de Compra/Evento/Abono/Turno, que ya guardan
// quién los registró).
export const AUDIT_ACCIONES = ['CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE'] as const;

export type AuditAccion = (typeof AUDIT_ACCIONES)[number];

export const AUDIT_ACCION_LABELS: Record<AuditAccion, string> = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
  ACTIVATE: 'Activó',
  DEACTIVATE: 'Desactivó',
};

export const AUDIT_MODELOS = [
  'Articulo',
  'Cliente',
  'Proveedor',
  'OpcionMenu',
  'TaxRate',
  'ParametroNomina',
  'DiaFestivo',
  'Usuario',
] as const;

export type AuditModelo = (typeof AUDIT_MODELOS)[number];

export const AUDIT_MODELO_LABELS: Record<AuditModelo, string> = {
  Articulo: 'Artículo',
  Cliente: 'Cliente',
  Proveedor: 'Proveedor',
  OpcionMenu: 'Opción de menú',
  TaxRate: 'Tarifa de impuesto',
  ParametroNomina: 'Parámetros de nómina',
  DiaFestivo: 'Día festivo',
  Usuario: 'Usuario',
};

export interface AuditLogDTO {
  id: string;
  modelo: string;
  registroId: string;
  registroNombre: string;
  accion: AuditAccion;
  detalle: unknown;
  userName: string;
  createdAt: string;
}
