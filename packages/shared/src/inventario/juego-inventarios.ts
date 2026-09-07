import { z } from 'zod';

// Módulo — Juego de Inventarios: CMV teórico vs. real (docs/spec_erp_afuego.md).
// CMV = Inventario inicial + Compras − Inventario final. El alcance de
// "Costo de Mercancía Vendida" se restringe a artículos de categoría
// MATERIA_PRIMA, igual que en el Dashboard (Fase 5) — es la definición
// contable estándar (mano de obra/transporte/artístico son gastos
// operativos, no "mercancía vendida").
export const inventarioFinalFisicoSchema = z.object({
  articuloId: z.string().min(1, 'Selecciona un artículo'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  quantity: z.number().nonnegative('La cantidad no puede ser negativa'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo').optional(),
});

export type InventarioFinalFisicoInput = z.infer<typeof inventarioFinalFisicoSchema>;

export interface JuegoInventariosIndicadorDTO {
  valor: number;
  porcentaje: number;
}

export interface JuegoInventariosDetalleDTO {
  articuloId: string;
  articuloNombre: string;
  articuloCodigo: string;
  unit: string;
  inventarioInicialValue: number;
  comprasValue: number;
  inventarioFinalSistemaValue: number;
  inventarioFinalFisicoQuantity: number;
  inventarioFinalFisicoValue: number;
  inventarioFinalFisicoRegistrado: boolean;
  cmvTeoricoValue: number;
  cmvRealValue: number;
  desviacionValue: number;
}

export interface JuegoInventariosReporteDTO {
  start: string;
  end: string;
  ventasTotales: number;
  consolidado: {
    inventarioInicial: number;
    compras: number;
    inventarioFinalSistema: number;
    inventarioFinalFisico: number;
    cmvTeorico: JuegoInventariosIndicadorDTO;
    cmvReal: JuegoInventariosIndicadorDTO;
    desviacion: JuegoInventariosIndicadorDTO;
  };
  detalle: JuegoInventariosDetalleDTO[];
}
