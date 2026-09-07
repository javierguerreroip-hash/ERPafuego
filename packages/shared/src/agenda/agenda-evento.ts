import { z } from 'zod';

// Módulo — Agenda de Eventos (docs/spec_erp_afuego.md). Los campos
// "compartidos con el Módulo 3" (fecha, cliente/menú, valor antes de
// impuestos, y por extensión número de personas) NO se duplican aquí: se
// leen en vivo del Evento vinculado (relación 1-a-1 por eventoId), para
// que la sincronización sea estructural y no dependa de lógica de
// actualización que se pueda desincronizar.
export const ESTADOS_ANTICIPO = ['SIN_ANTICIPO', 'SALDO_PENDIENTE', 'ANTICIPO_PAGADO'] as const;

export type EstadoAnticipo = (typeof ESTADOS_ANTICIPO)[number];

export const ESTADO_ANTICIPO_LABELS: Record<EstadoAnticipo, string> = {
  SIN_ANTICIPO: 'Sin anticipo',
  SALDO_PENDIENTE: 'Saldo pendiente',
  ANTICIPO_PAGADO: 'Anticipo pagado',
};

export const agendaEventoSchema = z.object({
  eventoId: z.string().min(1, 'Selecciona un evento'),
  personaContacto: z.string().max(200).default(''),
  telefonoContacto: z.string().max(50).default(''),
  direccion: z.string().max(300).default(''),
  horaServicio: z.string().max(20).default(''),
  anticipo: z.number().nonnegative('El anticipo no puede ser negativo').default(0),
  observaciones: z.string().max(2000).default(''),
  vendedorId: z.string().nullable().optional(),
});

export type AgendaEventoInput = z.infer<typeof agendaEventoSchema>;

// Al editar no se puede cambiar a qué Evento apunta (para eso se borra y
// se crea de nuevo) — evita reasignar por accidente un registro logístico
// ya diligenciado a un evento distinto.
export const agendaEventoUpdateSchema = agendaEventoSchema.omit({ eventoId: true });

export type AgendaEventoUpdateInput = z.infer<typeof agendaEventoUpdateSchema>;

export interface AgendaEventoDTO {
  id: string;
  eventoId: string;
  fecha: string;
  clienteNombre: string;
  opcionMenuNombre: string;
  numeroPersonas: number;
  valorAntesImpuestos: number;
  personaContacto: string;
  telefonoContacto: string;
  direccion: string;
  horaServicio: string;
  anticipo: number;
  saldoPendiente: number;
  estadoAnticipo: EstadoAnticipo;
  observaciones: string;
  vendedorId: string | null;
  vendedorNombre: string | null;
  createdAt: string;
  updatedAt: string;
}

// Eventos del Módulo 3 que todavía no tienen un registro en la Agenda —
// para el selector del formulario de creación manual.
export interface EventoDisponibleDTO {
  id: string;
  fecha: string;
  clienteNombre: string;
  opcionMenuNombre: string;
  numeroPersonas: number;
  valorAntesImpuestos: number;
}
