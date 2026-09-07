// Módulo — Estado de Resultados (docs/spec_erp_afuego.md): 5 pilares por
// período, 100% derivados de otros módulos (no hay datos propios que
// registrar aquí).
export interface EstadoResultadosPilarDTO {
  valor: number;
  porcentaje: number;
}

export interface EstadoResultadosDTO {
  start: string;
  end: string;
  ingresoTotal: EstadoResultadosPilarDTO;
  cmv: EstadoResultadosPilarDTO;
  gastosVenta: EstadoResultadosPilarDTO;
  gastosAdministrativos: EstadoResultadosPilarDTO;
  utilidadNeta: EstadoResultadosPilarDTO;
}
