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
  // Tope semanal de horas ordinarias (Art. 161 CST, reformado por la Ley
  // 2101 de 2021) — además del tope de 8h por turno, la ley colombiana
  // limita la jornada ordinaria a un máximo semanal, que bajó de forma
  // escalonada: 47h (jul-2023), 46h (jul-2024), 44h (jul-2025) y 42h
  // desde el 15 de julio de 2026 (valor vigente hoy). Configurable aquí
  // — nunca fijo en el código — para el día que la ley lo vuelva a
  // cambiar. Post-lanzamiento, 2026-10-01: agregado tras detectar que la
  // liquidación solo revisaba el tope diario, no el semanal.
  jornadaSemanalMaxima: z.number().positive('La jornada semanal máxima debe ser mayor a 0'),
  // Hora de entrada autorizada ("HH:MM", hora Colombia) — pedido del
  // negocio, 2026-10-01: si un empleado marca ANTES de esta hora, esos
  // minutos no cuentan como trabajados (ni para el tope diario ni el
  // semanal) — se calcula como si hubiera marcado justo a esta hora. Si
  // marca después (llegó tarde), se usa su hora real sin ajustar. La
  // hora de salida NUNCA se recorta. "00:00" equivale a desactivar la
  // regla (nunca recorta nada).
  horaEntradaAutorizada: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM (24 horas)'),
  recargoNocturno: z.number().min(0).max(3),
  recargoExtraDiurna: z.number().min(0).max(3),
  recargoExtraNocturna: z.number().min(0).max(3),
  recargoDominicalFestiva: z.number().min(0).max(3),
  recargoNocturnoDomFestivo: z.number().min(0).max(3),
  recargoExtraDiurnaDomFestiva: z.number().min(0).max(3),
  recargoExtraNocturnaDomFestiva: z.number().min(0).max(3),
  // % del salario diario que se paga por día de incapacidad (Ley
  // 100/CST) — 66.67% confirmado con el usuario 2026-09-15.
  porcentajeIncapacidad: z.number().min(0).max(1),
  // Deducciones de EPS y AFP — 4% cada una sobre el total devengado,
  // confirmado con el usuario 2026-09-15 contra la nómina manual.
  porcentajeEPS: z.number().min(0).max(1),
  porcentajeAFP: z.number().min(0).max(1),
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
