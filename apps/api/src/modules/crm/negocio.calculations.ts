// Eficiencia comercial del CRM: qué % del valor total cotizado (suma de
// Cotizado + Ganado + Perdido) terminó convirtiéndose en ventas cerradas
// (Ganado) — tasa de conversión por valor ("win rate"), confirmada con el
// usuario 2026-09-11.
export function calcularEficienciaComercial(totalGanado: number, totalCotizado: number): number {
  if (totalCotizado <= 0) return 0;
  return Math.round((totalGanado / totalCotizado) * 1000) / 10;
}
