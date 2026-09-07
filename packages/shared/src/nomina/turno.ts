import { z } from 'zod';

export const marcarSalidaSchema = z.object({
  horaSalida: z.string().min(1).optional(), // opcional: si no se envía, se usa "ahora"
});

export type MarcarSalidaInput = z.infer<typeof marcarSalidaSchema>;

// Solo Administrador usa este schema, para corregir/crear turnos manualmente.
export const turnoAdminSchema = z.object({
  userId: z.string().min(1, 'Selecciona un empleado'),
  horaEntrada: z.string().min(1, 'La hora de entrada es requerida'),
  horaSalida: z.string().min(1).nullable().optional(),
});

export type TurnoAdminInput = z.infer<typeof turnoAdminSchema>;

export interface TurnoDTO {
  id: string;
  userId: string;
  empleadoNombre: string;
  horaEntrada: string;
  horaSalida: string | null;
  horasTrabajadas: number | null;
}

// Desglose de horas de un turno o de un período completo, según los 8
// buckets del Código Sustantivo del Trabajo (ver decisión documentada en
// el README sobre la jornada ordinaria de 8h/turno usada para determinar
// horas extra).
export interface DesgloseHorasDTO {
  diurnaOrdinaria: number;
  nocturnaOrdinaria: number;
  extraDiurna: number;
  extraNocturna: number;
  dominicalFestivaDiurna: number;
  dominicalFestivaNocturna: number;
  extraDiurnaDominicalFestiva: number;
  extraNocturnaDominicalFestiva: number;
}

export interface LiquidacionQuincenalDTO {
  userId: string;
  empleadoNombre: string;
  start: string;
  end: string;
  desglose: DesgloseHorasDTO;
  valorHoraOrdinaria: number;
  valorPorConcepto: DesgloseHorasDTO;
  totalDevengadoHoras: number;
  diasTrabajados: number;
  auxilioTransporte: number;
  totalAPagar: number;
  turnos: TurnoDTO[];
}
