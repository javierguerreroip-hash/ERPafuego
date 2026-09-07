import { z } from 'zod';

// Módulo — Nómina (Cocina), docs/spec_erp_afuego.md. Parámetros legales
// configurables (nunca fijos en el código): SMLV, divisor de horas
// mensuales y los 7 recargos/horas extra vigentes según el Código
// Sustantivo del Trabajo colombiano — confirmados con el usuario:
// SMLV 2026 = $1.750.905, divisor = 210h (jornada de 42h semanales).
export const parametroNominaSchema = z.object({
  smlv: z.number().positive('El SMLV debe ser mayor a 0'),
  divisorHoras: z.number().positive('El divisor de horas debe ser mayor a 0'),
  auxilioTransporte: z.number().nonnegative('El auxilio de transporte no puede ser negativo'),
  recargoNocturno: z.number().min(0).max(3),
  recargoExtraDiurna: z.number().min(0).max(3),
  recargoExtraNocturna: z.number().min(0).max(3),
  recargoDominicalFestiva: z.number().min(0).max(3),
  recargoNocturnoDomFestivo: z.number().min(0).max(3),
  recargoExtraDiurnaDomFestiva: z.number().min(0).max(3),
  recargoExtraNocturnaDomFestiva: z.number().min(0).max(3),
});

export type ParametroNominaInput = z.infer<typeof parametroNominaSchema>;

export interface ParametroNominaDTO extends ParametroNominaInput {
  valorHoraOrdinaria: number;
  updatedAt: string;
}

export const diaFestivoSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  nombre: z.string().max(200).default(''),
});

export type DiaFestivoInput = z.infer<typeof diaFestivoSchema>;

export interface DiaFestivoDTO extends DiaFestivoInput {
  id: string;
}
