import type { ArticuloCategoria } from '../catalog/articulo.js';

// Pantalla principal — Dashboard general (docs/spec_erp_afuego.md).
// La especificación dice "Mano de obra tercerizada (mano de obra +
// artistas)" pero luego aclara: "transporte y servicios artísticos se
// muestran cada uno en su propio indicador, sin duplicar la categoría de
// mano de obra". Se tomó la nota como la instrucción vigente: 4
// indicadores de costo SIN solaparse (materia prima, mano de obra,
// transporte, artístico), uno por cada ArticuloCategoria relevante — nunca
// se cuenta el mismo consumo en dos indicadores a la vez.
export interface DashboardIndicadorDTO {
  valor: number;
  porcentaje: number;
}

export interface DashboardComposicionItemDTO {
  categoria: ArticuloCategoria;
  valor: number;
}

export interface DashboardTendenciaPuntoDTO {
  fecha: string;
  ventas: number;
  utilidad: number;
}

// Compras de una categoría de solo monitoreo (Insumos de Aseo,
// Utensilios — ver CATEGORIAS_MONITOREO) en el período, solo para
// vigilancia — a propósito NO están sumadas dentro de
// costosTotales/utilidadOperativa/composicionCostos.
export interface DashboardComprasMonitoreoItemDTO {
  categoria: ArticuloCategoria;
  valor: number;
}

export interface DashboardDTO {
  start: string;
  end: string;
  ventasTotales: number;
  costosTotales: DashboardIndicadorDTO;
  utilidadOperativa: DashboardIndicadorDTO;
  cmvMateriaPrima: DashboardIndicadorDTO;
  manoDeObra: DashboardIndicadorDTO;
  serviciosTransporte: DashboardIndicadorDTO;
  serviciosArtisticos: DashboardIndicadorDTO;
  composicionCostos: DashboardComposicionItemDTO[];
  tendencia: DashboardTendenciaPuntoDTO[];
  comprasMonitoreo: DashboardComprasMonitoreoItemDTO[];
}
