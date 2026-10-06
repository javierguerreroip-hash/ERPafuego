import { z } from 'zod';
import type { ArticuloCategoria } from '../catalog/articulo.js';

// Módulo 4 — Inventario en tiempo real (docs/spec_erp_afuego.md).
// "Inventario inicial" se declara manualmente por artículo, atado a una
// fecha exacta de inicio de período (día en que se hizo el conteo físico).
// Se registra en cantidad (para el detalle operativo por artículo) y se
// valoriza en $ con el costo unitario vigente en ese momento (editable,
// por si el operador conoce un costo distinto), para que el consolidado y
// el Juego de Inventarios (CMV) puedan sumar en pesos entre artículos con
// unidades distintas (kg, litros, unidades…).
export const inventarioInicialSchema = z.object({
  articuloId: z.string().min(1, 'Selecciona un artículo'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  quantity: z.number().nonnegative('La cantidad no puede ser negativa'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
});

export type InventarioInicialInput = z.infer<typeof inventarioInicialSchema>;

// Conteo físico de cierre de período (post-lanzamiento, 2026-09-24: se
// trasladó aquí desde el módulo de Juego de Inventarios, que ahora solo
// lo consume para calcular el CMV — ver decisión documentada en el
// README). Único por artículo + fecha, igual que InventarioInicial.
export const inventarioFinalFisicoSchema = z.object({
  articuloId: z.string().min(1, 'Selecciona un artículo'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  // 1 = primer conteo (para detectar diferencias contra el teórico);
  // 2 = conteo definitivo ya reconteado y ajustado. Solo el 2 pasa a ser el
  // inventario inicial del mes siguiente (post-lanzamiento, 2026-10-05).
  conteo: z.union([z.literal(1), z.literal(2)]).default(2),
  quantity: z.number().nonnegative('La cantidad no puede ser negativa'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
});

export type InventarioFinalFisicoInput = z.infer<typeof inventarioFinalFisicoSchema>;

export type ConteoFisico = 1 | 2;

// Días después de terminar un mes durante los cuales se permite cargar o
// corregir su cierre (conteo 1 y 2). Pasado ese plazo, solo Administrador.
export const DIAS_PLAZO_CIERRE_INVENTARIO = 7;

export interface InventarioDetalleDTO {
  articuloId: string;
  articuloNombre: string;
  articuloCodigo: string;
  category: ArticuloCategoria;
  unit: string;
  inventarioInicialQuantity: number;
  inventarioInicialValue: number;
  inventarioInicialRegistrado: boolean;
  comprasQuantity: number;
  comprasValue: number;
  consumoQuantity: number;
  consumoValue: number;
  // Inventario final "teórico" (de sistema) = inicial + compras − consumo.
  inventarioFinalTeoricoQuantity: number;
  inventarioFinalTeoricoValue: number;
  // Inventario final "físico" (real) = conteo manual de cierre de período.
  inventarioFinalFisicoQuantity: number;
  inventarioFinalFisicoValue: number;
  inventarioFinalFisicoRegistrado: boolean;
  // Los valores de arriba son los del conteo VIGENTE: el 2 si ya existe, y si
  // no, el 1 (provisional). null = todavía no hay ningún conteo.
  conteoFisicoVigente: ConteoFisico | null;
  conteo1Quantity: number | null;
  conteo1Value: number | null;
  conteo2Quantity: number | null;
  conteo2Value: number | null;
  // Desviación = físico − teórico (positiva = hay más de lo que el
  // sistema esperaba; negativa = merma/pérdida frente a lo esperado).
  desviacionQuantity: number;
  desviacionValue: number;
}

export interface InventarioReporteDTO {
  start: string;
  end: string;
  // Solo cuando el fin del período es el último día de un mes: hasta cuándo
  // (YYYY-MM-DD) se puede cargar o corregir el cierre sin ser Administrador.
  plazoCierre: { hasta: string; vencido: boolean } | null;
  detalle: InventarioDetalleDTO[];
  consolidado: {
    inventarioInicialValue: number;
    comprasValue: number;
    consumoValue: number;
    inventarioFinalTeoricoValue: number;
    inventarioFinalFisicoValue: number;
    desviacionValue: number;
  };
}
