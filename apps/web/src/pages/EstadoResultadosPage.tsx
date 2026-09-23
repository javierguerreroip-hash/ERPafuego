import { useEffect, useState } from 'react';
import type { EstadoResultadosDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { ExportButtons } from '../components/ExportButtons';
import { formatCOP } from '../lib/format';

const EXPORT_COLUMNS = [
  { key: 'concepto', label: 'Concepto' },
  { key: 'valor', label: 'Valor (COP)' },
  { key: 'porcentaje', label: '% sobre la venta' },
];

export function EstadoResultadosPage() {
  const { token } = useAuth();
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [estado, setEstado] = useState<EstadoResultadosDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<EstadoResultadosDTO>(`/estado-resultados?start=${start}&end=${end}`, { token })
      .then(setEstado)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el estado de resultados'))
      .finally(() => setLoading(false));
  }, [start, end, token]);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Estado de Resultados</h1>
          <p className="text-sm text-neutral-500">
            Ingreso total − CMV − Gastos de venta − Gastos administrativos = Utilidad neta.
          </p>
        </div>
        {estado && (
          <ExportButtons
            filename={`estado-resultados_${start}_${end}`}
            title="Estado de Resultados"
            subtitle={`Período: ${start} a ${end}`}
            columns={EXPORT_COLUMNS}
            rows={[
              { concepto: 'Ingreso total', valor: formatCOP(estado.ingresoTotal.valor), porcentaje: `${estado.ingresoTotal.porcentaje.toFixed(1)}%` },
              { concepto: 'Costo de mercancía vendida (CMV)', valor: `-${formatCOP(estado.cmv.valor)}`, porcentaje: `${estado.cmv.porcentaje.toFixed(1)}%` },
              { concepto: 'Gastos de venta', valor: `-${formatCOP(estado.gastosVenta.valor)}`, porcentaje: `${estado.gastosVenta.porcentaje.toFixed(1)}%` },
              { concepto: 'Gastos administrativos', valor: `-${formatCOP(estado.gastosAdministrativos.valor)}`, porcentaje: `${estado.gastosAdministrativos.porcentaje.toFixed(1)}%` },
              { concepto: 'Utilidad neta', valor: formatCOP(estado.utilidadNeta.valor), porcentaje: `${estado.utilidadNeta.porcentaje.toFixed(1)}%` },
            ]}
          />
        )}
      </div>

      <PeriodPickerControls filter={filter} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mb-4 text-sm text-neutral-400">Cargando…</p>}

      {estado && (
        <div className="max-w-xl overflow-hidden rounded-lg border bg-white">
          <Row label="Ingreso total" pilar={estado.ingresoTotal} strong />
          <Row label="(−) Costo de mercancía vendida (CMV)" pilar={estado.cmv} negative />
          <Row label="(−) Gastos de venta" pilar={estado.gastosVenta} negative />
          <Row label="(−) Gastos administrativos" pilar={estado.gastosAdministrativos} negative />
          <Row label="(=) Utilidad neta" pilar={estado.utilidadNeta} strong final />
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  pilar,
  strong,
  negative,
  final: isFinal,
}: {
  label: string;
  pilar: { valor: number; porcentaje: number };
  strong?: boolean;
  negative?: boolean;
  final?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        isFinal ? 'bg-orange-50' : 'border-t'
      }`}
    >
      <span className={`text-sm ${strong ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
        {label}
      </span>
      <div className="text-right">
        <p
          className={`text-sm ${strong ? 'font-semibold' : ''} ${
            negative || (isFinal && pilar.valor < 0) ? 'text-red-600' : 'text-neutral-900'
          }`}
        >
          {negative ? `-${formatCOP(Math.abs(pilar.valor))}` : formatCOP(pilar.valor)}
        </p>
        <p className="text-xs text-neutral-400">{pilar.porcentaje.toFixed(1)}% sobre la venta</p>
      </div>
    </div>
  );
}
