import { useEffect, useState } from 'react';
import {
  ARTICULO_CATEGORIA_LABELS,
  type InventarioDetalleDTO,
  type InventarioReporteDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { InventarioInicialModal } from '../components/InventarioInicialModal';
import { KpiCard } from '../components/KpiCard';
import { formatCOP } from '../lib/format';

export function InventarioPage() {
  const { token } = useAuth();
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [reporte, setReporte] = useState<InventarioReporteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inicialFor, setInicialFor] = useState<InventarioDetalleDTO | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<InventarioReporteDTO>(
        `/inventario?start=${start}&end=${end}`,
        { token },
      );
      setReporte(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-neutral-900">Inventario en Tiempo Real</h1>
        <p className="text-sm text-neutral-500">
          Inventario final = Inventario inicial + Compras − Consumo, por artículo y consolidado.
        </p>
      </div>

      <PeriodPickerControls filter={filter} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {reporte && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Inventario inicial" value={reporte.consolidado.inventarioInicialValue} />
          <KpiCard label="Compras" value={reporte.consolidado.comprasValue} />
          <KpiCard label="Costos y consumos" value={reporte.consolidado.consumoValue} />
          <KpiCard label="Inventario final" value={reporte.consolidado.inventarioFinalValue} highlight />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Artículo</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Inventario inicial</th>
              <th className="px-4 py-2">Compras</th>
              <th className="px-4 py-2">Consumo</th>
              <th className="px-4 py-2">Inventario final</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : !reporte || reporte.detalle.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  No hay artículos activos.
                </td>
              </tr>
            ) : (
              reporte.detalle.map((item) => (
                <tr key={item.articuloId} className="border-t align-top">
                  <td className="px-4 py-2">
                    {item.articuloNombre}{' '}
                    <span className="text-xs text-neutral-400">({item.articuloCodigo})</span>
                  </td>
                  <td className="px-4 py-2">{ARTICULO_CATEGORIA_LABELS[item.category]}</td>
                  <td className="px-4 py-2">
                    {item.inventarioInicialRegistrado ? (
                      <>
                        {item.inventarioInicialQuantity} {item.unit}
                        <p className="text-xs text-neutral-400">{formatCOP(item.inventarioInicialValue)}</p>
                      </>
                    ) : (
                      <span className="text-xs text-amber-600">Sin registrar</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.comprasQuantity} {item.unit}
                    <p className="text-xs text-neutral-400">{formatCOP(item.comprasValue)}</p>
                  </td>
                  <td className="px-4 py-2">
                    {item.consumoQuantity} {item.unit}
                    <p className="text-xs text-neutral-400">{formatCOP(item.consumoValue)}</p>
                  </td>
                  <td className="px-4 py-2">
                    <span className={item.inventarioFinalQuantity < 0 ? 'text-red-600' : ''}>
                      {item.inventarioFinalQuantity} {item.unit}
                    </span>
                    <p className="text-xs text-neutral-400">{formatCOP(item.inventarioFinalValue)}</p>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setInicialFor(item)}
                      className="text-orange-600 hover:underline"
                    >
                      {item.inventarioInicialRegistrado ? 'Editar inicial' : 'Registrar inicial'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {inicialFor && (
        <InventarioInicialModal
          articulo={inicialFor}
          fecha={start}
          onClose={() => setInicialFor(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
