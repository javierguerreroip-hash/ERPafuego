import { useEffect, useState } from 'react';
import type { InventarioDetalleDTO, InventarioReporteDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { InventarioInicialModal } from '../components/InventarioInicialModal';
import { InventarioFinalFisicoModal } from '../components/InventarioFinalFisicoModal';
import { InventarioFinalFisicoImportModal } from '../components/InventarioFinalFisicoImportModal';
import { KpiCard } from '../components/KpiCard';
import { inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

export function InventarioPage() {
  const { token, user } = useAuth();
  const readOnly = user?.role === 'CONSULTA';
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [reporte, setReporte] = useState<InventarioReporteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inicialFor, setInicialFor] = useState<InventarioDetalleDTO | null>(null);
  const [fisicoFor, setFisicoFor] = useState<InventarioDetalleDTO | null>(null);
  const [showImportFisico, setShowImportFisico] = useState(false);
  const [search, setSearch] = useState('');

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

  const filteredDetalle = (reporte?.detalle ?? []).filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.articuloNombre.toLowerCase().includes(q) ||
      item.articuloCodigo.toLowerCase().includes(q)
    );
  });

  async function handleImportRow(articuloId: string, quantity: number) {
    await apiFetch('/inventario/final-fisico', {
      method: 'POST',
      body: { articuloId, fecha: end, quantity },
      token,
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Inventario en Tiempo Real</h1>
          <p className="text-sm text-neutral-500">
            Solo materia prima. Inventario final teórico = Inventario inicial + Compras − Consumo;
            el físico es el conteo manual de cierre de período.
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportFisico(true)}
              className="rounded-md border border-orange-600 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              Cargar conteo físico (Excel)
            </button>
          </div>
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
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Inventario inicial" value={reporte.consolidado.inventarioInicialValue} />
          <KpiCard label="Compras" value={reporte.consolidado.comprasValue} />
          <KpiCard label="Costos y consumos" value={reporte.consolidado.consumoValue} />
          <KpiCard
            label="Inventario final teórico (Sistema)"
            value={reporte.consolidado.inventarioFinalTeoricoValue}
          />
          <KpiCard
            label="Inventario final físico (Real)"
            value={reporte.consolidado.inventarioFinalFisicoValue}
            highlight
          />
          <KpiCard
            label="Desviación (Real − Teórico)"
            value={reporte.consolidado.desviacionValue}
            negative={reporte.consolidado.desviacionValue < 0}
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Artículo</th>
              <th className="px-4 py-2">Inventario inicial</th>
              <th className="px-4 py-2">Compras</th>
              <th className="px-4 py-2">Consumo</th>
              <th className="px-4 py-2">Inv. final teórico (Sistema)</th>
              <th className="px-4 py-2">Inv. final físico (Real)</th>
              <th className="px-4 py-2">Desviación</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : !reporte || reporte.detalle.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  No hay artículos de materia prima activos.
                </td>
              </tr>
            ) : filteredDetalle.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
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
                    <span className={item.inventarioFinalTeoricoQuantity < 0 ? 'text-red-600' : ''}>
                      {item.inventarioFinalTeoricoQuantity} {item.unit}
                    </span>
                    <p className="text-xs text-neutral-400">
                      {formatCOP(item.inventarioFinalTeoricoValue)}
                    </p>
                  </td>
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
                  <td className="px-4 py-2">
                    {item.inventarioFinalFisicoRegistrado ? (
                      <>
                        <span className={item.desviacionQuantity < 0 ? 'text-red-600' : ''}>
                          {item.desviacionQuantity} {item.unit}
                        </span>
                        <p
                          className={`text-xs ${item.desviacionValue < 0 ? 'text-red-500' : 'text-neutral-400'}`}
                        >
                          {formatCOP(item.desviacionValue)}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="space-x-3 px-4 py-2 text-right">
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => setInicialFor(item)}
                          className="text-orange-600 hover:underline"
                        >
                          {item.inventarioInicialRegistrado ? 'Editar inicial' : 'Registrar inicial'}
                        </button>
                        <button
                          onClick={() => setFisicoFor(item)}
                          className="text-orange-600 hover:underline"
                        >
                          {item.inventarioFinalFisicoRegistrado ? 'Editar físico' : 'Registrar físico'}
                        </button>
                      </>
                    )}
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

      {fisicoFor && (
        <InventarioFinalFisicoModal
          articulo={fisicoFor}
          fecha={end}
          onClose={() => setFisicoFor(null)}
          onSaved={load}
        />
      )}

      {showImportFisico && reporte && (
        <InventarioFinalFisicoImportModal
          articulos={reporte.detalle.map((d) => ({
            articuloId: d.articuloId,
            articuloCodigo: d.articuloCodigo,
            articuloNombre: d.articuloNombre,
            unit: d.unit,
          }))}
          fecha={end}
          onSaveRow={handleImportRow}
          onClose={() => setShowImportFisico(false)}
          onDone={() => {
            setShowImportFisico(false);
            load();
          }}
        />
      )}
    </div>
  );
}
