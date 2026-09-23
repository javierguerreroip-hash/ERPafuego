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
  quantity: z.number().nonnegative('La cantidad no puede ser negativa'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
});

export type InventarioFinalFisicoInput = z.infer<typeof inventarioFinalFisicoSchema>;

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
  // Desviación = físico − teórico (positiva = hay más de lo que el
  // sistema esperaba; negativa = merma/pérdida frente a lo esperado).
  desviacionQuantity: number;
  desviacionValue: number;
}

export interface InventarioReporteDTO {
  start: string;
  end: string;
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
