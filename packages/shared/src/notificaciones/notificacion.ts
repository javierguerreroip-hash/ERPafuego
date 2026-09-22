// Notificaciones dentro de la aplicación (Etapa 2, post-lanzamiento
// 2026-09-23) — sin correo electrónico. Por ahora solo las genera la
// Agenda de Eventos.
export const NOTIFICACION_TIPOS = [
  'AGENDA_EVENTO_CREADO',
  'AGENDA_EVENTO_EDITADO',
  'AGENDA_EVENTO_ELIMINADO',
] as const;

export type NotificacionTipo = (typeof NOTIFICACION_TIPOS)[number];

export interface NotificacionDTO {
  id: string;
  tipo: NotificacionTipo;
  mensaje: string;
  agendaEventoId: string | null;
  createdByName: string | null;
  createdAt: string;
  leida: boolean;
}

export interface NotificacionResumenDTO {
  noLeidas: number;
}
