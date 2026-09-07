import type { PeriodFilter } from '../hooks/usePeriodFilter';
import { PERIOD_TYPE_LABELS, type PeriodType } from '../lib/periods';
import { inputClass } from './Field';

const PERIOD_TYPES: PeriodType[] = ['DIA', 'SEMANA', 'QUINCENA', 'MES', 'PERSONALIZADO'];

export function PeriodPickerControls({ filter }: { filter: PeriodFilter }) {
  const {
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
  } = filter;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Período</label>
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as PeriodType)}
          className={inputClass}
        >
          {PERIOD_TYPES.map((type) => (
            <option key={type} value={type}>
              {PERIOD_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {periodType === 'PERSONALIZADO' ? (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Desde</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Hasta</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Fecha de referencia
          </label>
          <input
            type="date"
            value={refDate}
            onChange={(e) => setRefDate(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Período: {new Date(`${start}T00:00:00`).toLocaleDateString('es-CO')} —{' '}
        {new Date(`${end}T00:00:00`).toLocaleDateString('es-CO')}
      </p>
    </div>
  );
}
