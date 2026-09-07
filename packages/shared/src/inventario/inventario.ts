import { z } from 'zod';
import type { ArticuloCategoria } from '../catalog/articulo.js';

// Módulo 4 — Inventario en tiempo real (docs/spec_erp_afuego.md).
// "Inventario inicial" se declara manualmente por artículo, atado a una
// fecha exacta de inicio de período (día en que se hizo el conteo físico).
// Se registra en cantidad (para el detalle operativo por artículo) y se
// valoriza en $ con el costo unitario vigente en ese momento (editable,
// por si el operador conoce un costo distinto), para que el consolidado y
// el futuro Módulo 8 (CMV) puedan sumar en pesos entre artículos con
// unidades distintas (kg, litros, unidades…).
export const inventarioInicialSchema = z.object({
  articuloId: z.string().min(1, 'Selecciona un artículo'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  quantity: z.number().nonnegative('La cantidad no puede ser negativa'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
});

export type InventarioInicialInput = z.infer<typeof inventarioInicialSchema>;

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
  inventarioFinalQuantity: number;
  inventarioFinalValue: number;
}

export interface InventarioReporteDTO {
  start: string;
  end: string;
  detalle: InventarioDetalleDTO[];
  consolidado: {
    inventarioInicialValue: number;
    comprasValue: number;
    consumoValue: number;
    inventarioFinalValue: number;
  };
}
