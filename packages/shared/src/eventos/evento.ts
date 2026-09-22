import { z } from 'zod';

// Módulo 3 — Ventas y costos por evento (docs/spec_erp_afuego.md).
// "Valor antes de impuestos" siempre se digita manualmente (confirmado con
// el negocio: las cotizaciones reales se negocian, no siguen el precio de
// lista de la opción de menú de forma estricta). "Valor después de
// impuestos" se calcula a partir de la tasa de impuesto seleccionada
// (parámetro configurable). La utilidad operacional se calcula sobre el
// valor ANTES de impuestos (el IVA/impoconsumo cobrado no es ingreso real
// de la empresa).
export const eventoSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  opcionMenuId: z.string().min(1, 'Selecciona una opción de menú'),
  numeroPersonas: z.number().int().positive('El número de personas debe ser mayor a 0'),
  valorAntesImpuestos: z.number().nonnegative('El valor no puede ser negativo'),
  taxRateId: z.string().nullable().optional(),
  vendedorId: z.string().min(1, 'Selecciona un vendedor'),
});

export type EventoInput = z.infer<typeof eventoSchema>;

export interface EventoDTO {
  id: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  opcionMenuId: string;
  opcionMenuNombre: string;
  numeroPersonas: number;
  valorAntesImpuestos: number;
  valorDespuesImpuestos: number;
  taxRateId: string | null;
  taxRateNombre: string | null;
  // Null solo en eventos creados antes de exigir vendedorId
  // (2026-09-22) que aún no se han editado.
  vendedorId: string | null;
  vendedorNombre: string | null;
  costoTotal: number;
  costoTotalPorcentaje: number;
  utilidadOperacional: number;
  utilidadOperacionalPorcentaje: number;
  registeredByName: string;
  createdAt: string;
}

export const eventoConsumoSchema = z.object({
  articuloId: z.string().min(1, 'Selecciona un artículo'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
});

export type EventoConsumoInput = z.infer<typeof eventoConsumoSchema>;

export const eventoConsumoUpdateSchema = z.object({
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
});

export type EventoConsumoUpdateInput = z.infer<typeof eventoConsumoUpdateSchema>;

export interface EventoConsumoDTO {
  id: string;
  eventoId: string;
  articuloId: string;
  articuloNombre: string;
  articuloCodigo: string;
  quantity: number;
  unit: string;
  unitCost: number;
  subtotal: number;
  createdAt: string;
}

export interface EventoDetailDTO extends EventoDTO {
  consumos: EventoConsumoDTO[];
}

// Ranking de opciones de menú vendidas (post-lanzamiento, 2026-09-11):
// cuántas veces se vendió cada opción del catálogo (un evento = una
// unidad vendida) y a cuántas personas atendió, en el período elegido.
export interface RankingOpcionDTO {
  opcionMenuId: string;
  opcionMenuNombre: string;
  unidadesVendidas: number;
  personasAtendidas: number;
}

export interface RankingOpcionesReporteDTO {
  start: string;
  end: string;
  totalPersonasAtendidas: number;
  ranking: RankingOpcionDTO[];
}
