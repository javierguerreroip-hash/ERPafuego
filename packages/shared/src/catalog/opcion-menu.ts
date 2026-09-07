import { z } from 'zod';

// Catálogo de opciones de venta del menú (docs/spec_erp_afuego.md, sección
// 1.1 + Anexo A "Carta 2026"). Es un catálogo distinto al de Articulo: este
// es del lado de la venta (lo que se le cotiza al cliente), mientras que
// Articulo es del lado del costo/compra (lo que se compra y se consume).
export const OPCION_MENU_CATEGORIAS = [
  'MOMENTOS_FUERTES',
  'PARRILLA',
  'PAELLAS',
  'BOCADOS_SNACKS',
  'REFRIGERIOS',
  'INFANTIL',
  'ADICIONALES',
] as const;

export type OpcionMenuCategoria = (typeof OPCION_MENU_CATEGORIAS)[number];

export const OPCION_MENU_CATEGORIA_LABELS: Record<OpcionMenuCategoria, string> = {
  MOMENTOS_FUERTES: 'Momentos / Fuertes',
  PARRILLA: 'Parrilla',
  PAELLAS: 'Paellas',
  BOCADOS_SNACKS: 'Bocados / Snacks',
  REFRIGERIOS: 'Refrigerios',
  INFANTIL: 'Menú infantil',
  ADICIONALES: 'Adicionales',
};

export const PRICE_TYPES = ['POR_PERSONA', 'POR_UNIDAD'] as const;

export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  POR_PERSONA: 'Por persona',
  POR_UNIDAD: 'Por unidad',
};

export const opcionMenuSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  category: z.enum(OPCION_MENU_CATEGORIAS),
  description: z.string().max(2000).default(''),
  priceType: z.enum(PRICE_TYPES),
  price: z.number().nonnegative('El precio no puede ser negativo'),
});

export type OpcionMenuInput = z.infer<typeof opcionMenuSchema>;

export interface OpcionMenuDTO extends OpcionMenuInput {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
