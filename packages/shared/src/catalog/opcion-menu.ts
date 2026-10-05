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
  // Costo por UNA unidad de venta (persona o unidad), calculado en vivo a
  // partir de la receta — nunca se edita a mano (dato derivado).
  costo: number;
  // Costo como % del precio de venta.
  costoPorcentaje: number;
  ingredientesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Recetas de las opciones de menú (post-lanzamiento, 2026-10-05): cantidad
// de cada artículo de Materia Prima por UNA unidad de venta, expresada en
// la unidad del artículo. Se carga de forma masiva desde la plantilla de
// Excel. Al importar, la receta de cada menú que venga en el archivo
// REEMPLAZA a la anterior; los menús que no vienen quedan intactos.
export const recetaImportSchema = z.object({
  items: z
    .array(
      z.object({
        opcionMenuId: z.string().min(1),
        articuloId: z.string().min(1),
        cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
      }),
    )
    .min(1, 'El archivo no tiene cantidades diligenciadas')
    .max(5000, 'Demasiadas filas en un solo archivo'),
});

export type RecetaImportInput = z.infer<typeof recetaImportSchema>;

export interface RecetaImportResultDTO {
  menusActualizados: number;
  ingredientes: number;
}

export interface RecetaPlantillaArticuloDTO {
  id: string;
  code: string;
  name: string;
  unit: string;
  // Mismo costo unitario que usa un consumo de evento (promedio entre el
  // último precio de compra y el inventario inicial más reciente).
  costoUnitario: number;
}

export interface RecetaPlantillaMenuDTO {
  id: string;
  name: string;
  category: OpcionMenuCategoria;
  description: string;
  priceType: PriceType;
  price: number;
  active: boolean;
  // Receta ya guardada (se precarga con sus cantidades).
  ingredientes: { articuloId: string; cantidad: number }[];
  // Artículos mencionados en la descripción que todavía no están en la
  // receta — se precargan con la cantidad vacía.
  sugeridos: string[];
}

export interface RecetaPlantillaDTO {
  menus: RecetaPlantillaMenuDTO[];
  articulos: RecetaPlantillaArticuloDTO[];
}
