export type PeriodType = 'DIA' | 'SEMANA' | 'QUINCENA' | 'MES' | 'PERSONALIZADO';

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  DIA: 'Día',
  SEMANA: 'Semana',
  QUINCENA: 'Quincena',
  MES: 'Mes',
  PERSONALIZADO: 'Personalizado',
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Calcula el rango [start, end] (YYYY-MM-DD) para el tipo de período
// elegido, según el filtro pedido por el Módulo 4 (día/semana/mes/
// personalizado). refDate ancla la semana/mes cuando el tipo no es
// personalizado.
export function computeRange(
  type: PeriodType,
  refDate: string,
  customStart: string,
  customEnd: string,
): { start: string; end: string } {
  if (type === 'PERSONALIZADO') {
    return { start: customStart || refDate, end: customEnd || refDate };
  }

  const ref = new Date(`${refDate}T00:00:00`);

  if (type === 'DIA') {
    return { start: refDate, end: refDate };
  }

  if (type === 'SEMANA') {
    const day = ref.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: toISODate(monday), end: toISODate(sunday) };
  }

  if (type === 'QUINCENA') {
    if (ref.getDate() <= 15) {
      const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const fifteen = new Date(ref.getFullYear(), ref.getMonth(), 15);
      return { start: toISODate(first), end: toISODate(fifteen) };
    }
    const sixteen = new Date(ref.getFullYear(), ref.getMonth(), 16);
    const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { start: toISODate(sixteen), end: toISODate(last) };
  }

  // MES
  const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const last = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { start: toISODate(first), end: toISODate(last) };
}
