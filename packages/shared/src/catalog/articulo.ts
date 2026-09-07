import { z } from 'zod';

// Categorías de costo/compra del Módulo 1 (docs/spec_erp_afuego.md, sección 1.1).
// La especificación original lista 6 letras (a-f), pero (c) "Servicio de
// transporte" y (f) "Transporte" describen la misma categoría (el Dashboard y
// el Estado de Resultados solo manejan un único indicador de transporte), así
// que se unificaron en una sola.
export const ARTICULO_CATEGORIAS = [
  'MATERIA_PRIMA',
  'MANO_DE_OBRA',
  'SERVICIO_TRANSPORTE',
  'SERVICIOS_ARTISTICOS',
  'ALQUILER_MENAJE_EQUIPOS',
] as const;

export type ArticuloCategoria = (typeof ARTICULO_CATEGORIAS)[number];

export const ARTICULO_CATEGORIA_LABELS: Record<ArticuloCategoria, string> = {
  MATERIA_PRIMA: 'Materia prima',
  MANO_DE_OBRA: 'Mano de obra (tercerizada)',
  SERVICIO_TRANSPORTE: 'Servicio de transporte',
  SERVICIOS_ARTISTICOS: 'Servicios artísticos',
  ALQUILER_MENAJE_EQUIPOS: 'Alquiler de menaje y equipos',
};

export const articuloSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(50),
  name: z.string().min(1, 'El nombre es requerido').max(200),
  category: z.enum(ARTICULO_CATEGORIAS),
  unit: z.string().min(1, 'La unidad de medida es requerida').max(50),
});

export type ArticuloInput = z.infer<typeof articuloSchema>;

export interface ArticuloDTO extends ArticuloInput {
  id: string;
  lastPurchasePrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
