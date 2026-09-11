export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

// Los campos "solo fecha" del backend (fechaEvento, fechaCompra,
// fechaVencimiento…) llegan como ISO con hora UTC medianoche (ej.
// "2026-09-26T00:00:00.000Z"). Formatearlos con el huso horario local del
// navegador (Colombia es UTC-5) los corre un día atrás — se fuerza a leer
// los componentes de fecha en UTC para mostrar exactamente el día
// guardado, sin importar el huso del navegador.
export function formatDateOnly(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('es-CO', { timeZone: 'UTC', ...options });
}
