import { useEffect, useState } from 'react';
import type { JuegoInventariosReporteDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { KpiCard } from '../components/KpiCard';
import { ExportButtons } from '../components/ExportButtons';
import { inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

const EXPORT_COLUMNS = [
  { key: 'articulo', label: 'Artículo' },
  { key: 'inventarioInicial', label: 'Inv. inicial' },
  { key: 'compras', label: 'Compras' },
  { key: 'inventarioFinalFisico', label: 'Inv. final físico (Real)' },
  { key: 'cmv', label: 'CMV' },
];

export function JuegoInventariosPage() {
  const { token } = useAuth();
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [reporte, setReporte] = useState<JuegoInventariosReporteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<JuegoInventariosReporteDTO>(
        `/juego-inventarios?start=${start}&end=${end}`,
        { token },
      );
      setReporte(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el juego de inventarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  const filteredDetalle = (reporte?.detalle ?? []).filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.articuloNombre.toLowerCase().includes(q) ||
      item.articuloCodigo.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Juego de Inventarios</h1>
          <p className="text-sm text-neutral-500">
            CMV (Costo de Mercancía Vendida) — solo materia prima. CMV = Inventario inicial +
            Compras − Inventario final físico (Real). El conteo físico se registra desde el
            módulo de Inventario.
          </p>
        </div>
        {reporte && (
          <ExportButtons
            filename={`juego-inventarios_${start}_${end}`}
            title="Juego de Inventarios — CMV"
            subtitle={`Período: ${start} a ${end}`}
            columns={EXPORT_COLUMNS}
            rows={reporte.detalle.map((item) => ({
              articulo: `${item.articuloNombre} (${item.articuloCodigo})`,
              inventarioInicial: formatCOP(item.inventarioInicialValue),
              compras: formatCOP(item.comprasValue),
              inventarioFinalFisico: item.inventarioFinalFisicoRegistrado
                ? formatCOP(item.inventarioFinalFisicoValue)
                : 'Sin registrar',
              cmv: formatCOP(item.cmvValue),
            }))}
          />
        )}
      </div>

      <PeriodPickerControls filter={filter} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código de artículo…"
          className={`${inputClass} max-w-sm`}
        />
      </div>

      {reporte && (
        <div className="mb-4 max-w-xs">
          <KpiCard
            label="CMV"
            value={reporte.consolidado.cmv.valor}
            porcentaje={reporte.consolidado.cmv.porcentaje}
            highlight
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Artículo</th>
              <th className="px-4 py-2">Inv. inicial</th>
              <th className="px-4 py-2">Compras</th>
              <th className="px-4 py-2">Inv. final físico (Real)</th>
              <th className="px-4 py-2">CMV</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : !reporte || reporte.detalle.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  No hay artículos de materia prima activos.
                </td>
              </tr>
            ) : filteredDetalle.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Ningún artículo coincide con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredDetalle.map((item) => (
                <tr key={item.articuloId} className="border-t align-top">
                  <td className="px-4 py-2">
                    {item.articuloNombre}{' '}
                    <span className="text-xs text-neutral-400">({item.articuloCodigo})</span>
                  </td>
                  <td className="px-4 py-2">{formatCOP(item.inventarioInicialValue)}</td>
                  <td className="px-4 py-2">{formatCOP(item.comprasValue)}</td>
                  <td className="px-4 py-2">
                    {item.inventarioFinalFisicoRegistrado ? (
                      <>
                        {item.inventarioFinalFisicoQuantity} {item.unit}
                        <p className="text-xs text-neutral-400">
                          {formatCOP(item.inventarioFinalFisicoValue)}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-amber-600">Sin registrar</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{formatCOP(item.cmvValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
