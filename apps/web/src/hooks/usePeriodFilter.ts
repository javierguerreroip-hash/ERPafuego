import { useMemo, useState } from 'react';
import { computeRange, type PeriodType } from '../lib/periods';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Estado del filtro de período (día/semana/mes/personalizado) compartido
// por Inventario (Módulo 4) y el Dashboard (pantalla principal).
export function usePeriodFilter(initialType: PeriodType = 'MES') {
  const [periodType, setPeriodType] = useState<PeriodType>(initialType);
  const [refDate, setRefDate] = useState(today());
  const [customStart, setCustomStart] = useState(today());
  const [customEnd, setCustomEnd] = useState(today());

  const { start, end } = useMemo(
    () => computeRange(periodType, refDate, customStart, customEnd),
    [periodType, refDate, customStart, customEnd],
  );

  return {
    periodType,
    setPeriodType,
    refDate,
    setRefDate,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    start,
    end,
  };
}

export type PeriodFilter = ReturnType<typeof usePeriodFilter>;
