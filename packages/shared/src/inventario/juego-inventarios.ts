// Módulo — Juego de Inventarios: CMV (docs/spec_erp_afuego.md).
// CMV = Inventario inicial + Compras − Inventario final. El alcance de
// "Costo de Mercancía Vendida" se restringe a artículos de categoría
// MATERIA_PRIMA, igual que en el Dashboard (Fase 5) — es la definición
// contable estándar (mano de obra/transporte/artístico son gastos
// operativos, no "mercancía vendida").
//
// Actualización post-lanzamiento (2026-09-24): este módulo dejó de tener
// su propio "CMV teórico" y "CMV real" con desviación entre los dos — esa
// comparación (teórico vs. físico) ahora vive en el módulo de Inventario
// (Módulo 4, ver inventario.ts), que es dueño del "inventario final
// teórico" y del conteo físico. Aquí queda un solo CMV, calculado siempre
// con el inventario final FÍSICO/real (no el teórico) — el registro del
// conteo físico también se trasladó a Inventario; este módulo solo lo
// consume de solo lectura.
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
  inventarioFinalFisicoQuantity: number;
  inventarioFinalFisicoValue: number;
  inventarioFinalFisicoRegistrado: boolean;
  cmvValue: number;
}

export interface JuegoInventariosReporteDTO {
  start: string;
  end: string;
  ventasTotales: number;
  consolidado: {
    inventarioInicial: number;
    compras: number;
    inventarioFinalFisico: number;
    cmv: JuegoInventariosIndicadorDTO;
  };
  detalle: JuegoInventariosDetalleDTO[];
}
