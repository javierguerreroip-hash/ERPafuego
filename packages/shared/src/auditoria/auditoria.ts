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

// Todos los modelos que se pueden crear/editar/eliminar desde la
// aplicación (coincide 1 a 1 con los nombres de modelo de
// schema.prisma — el interceptor automático de lib/prisma.ts emite ese
// mismo nombre literal). AuditLog no aparece: no se audita a sí mismo.
export const AUDIT_MODELOS = [
  'Articulo',
  'Cliente',
  'ClienteArchivo',
  'Proveedor',
  'OpcionMenu',
  'TaxRate',
  'ParametroNomina',
  'DiaFestivo',
  'User',
  'Compra',
  'Evento',
  'EventoConsumo',
  'Negocio',
  'Cotizacion',
  'AgendaEvento',
  'InventarioInicial',
  'InventarioFinalFisico',
  'GastoAdministrativo',
  'Turno',
  'Incapacidad',
  'Abono',
  'CuentaPorPagar',
] as const;

export type AuditModelo = (typeof AUDIT_MODELOS)[number];

export const AUDIT_MODELO_LABELS: Record<AuditModelo, string> = {
  Articulo: 'Artículo',
  Cliente: 'Cliente',
  ClienteArchivo: 'Archivo de cliente',
  Proveedor: 'Proveedor',
  OpcionMenu: 'Opción de menú',
  TaxRate: 'Tarifa de impuesto',
  ParametroNomina: 'Parámetros de nómina',
  DiaFestivo: 'Día festivo',
  User: 'Usuario',
  Compra: 'Compra',
  Evento: 'Venta (evento)',
  EventoConsumo: 'Consumo de evento',
  Negocio: 'Negocio (CRM)',
  Cotizacion: 'Cotización',
  AgendaEvento: 'Agenda de eventos',
  InventarioInicial: 'Inventario inicial',
  InventarioFinalFisico: 'Inventario final físico',
  GastoAdministrativo: 'Gasto administrativo',
  Turno: 'Turno (nómina)',
  Incapacidad: 'Incapacidad',
  Abono: 'Abono / pago',
  CuentaPorPagar: 'Cuenta por pagar',
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
