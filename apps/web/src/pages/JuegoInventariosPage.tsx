import { useEffect, useState } from 'react';
import type { JuegoInventariosDetalleDTO, JuegoInventariosReporteDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { InventarioFinalFisicoModal } from '../components/InventarioFinalFisicoModal';
import { KpiCard } from '../components/KpiCard';
import { ExportButtons } from '../components/ExportButtons';
import { formatCOP } from '../lib/format';

const EXPORT_COLUMNS = [
  { key: 'articulo', label: 'Artículo' },
  { key: 'inventarioInicial', label: 'Inv. inicial' },
  { key: 'compras', label: 'Compras' },
  { key: 'inventarioFinalSistema', label: 'Inv. final sistema' },
  { key: 'inventarioFinalFisico', label: 'Inv. final físico' },
  { key: 'cmvTeorico', label: 'CMV teórico' },
  { key: 'cmvReal', label: 'CMV real' },
  { key: 'desviacion', label: 'Desviación' },
];

export function JuegoInventariosPage() {
  const { token, user } = useAuth();
  const readOnly = user?.role === 'CONSULTA';
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [reporte, setReporte] = useState<JuegoInventariosReporteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalFisicoFor, setFinalFisicoFor] = useState<JuegoInventariosDetalleDTO | null>(null);

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

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Juego de Inventarios</h1>
          <p className="text-sm text-neutral-500">
            CMV teórico (de sistema) vs. CMV real (conteo físico) — solo artículos de materia
            prima. CMV = Inventario inicial + Compras − Inventario final.
          </p>
        </div>
        {reporte && (
          <ExportButtons
            filename={`juego-inventarios_${start}_${end}`}
            title="Juego de Inventarios — CMV teórico vs. real"
            subtitle={`Período: ${start} a ${end}`}
            columns={EXPORT_COLUMNS}
            rows={reporte.detalle.map((item) => ({
              articulo: `${item.articuloNombre} (${item.articuloCodigo})`,
              inventarioInicial: formatCOP(item.inventarioInicialValue),
              compras: formatCOP(item.comprasValue),
              inventarioFinalSistema: formatCOP(item.inventarioFinalSistemaValue),
              inventarioFinalFisico: item.inventarioFinalFisicoRegistrado
                ? formatCOP(item.inventarioFinalFisicoValue)
                : 'Sin registrar',
              cmvTeorico: formatCOP(item.cmvTeoricoValue),
              cmvReal: formatCOP(item.cmvRealValue),
              desviacion: formatCOP(item.desviacionValue),
            }))}
          />
        )}
      </div>

      <PeriodPickerControls filter={filter} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {reporte && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <KpiCard
            label="CMV teórico"
            value={reporte.consolidado.cmvTeorico.valor}
            porcentaje={reporte.consolidado.cmvTeorico.porcentaje}
          />
          <KpiCard
            label="CMV real"
            value={reporte.consolidado.cmvReal.valor}
            porcentaje={reporte.consolidado.cmvReal.porcentaje}
            highlight
          />
          <KpiCard
            label="Desviación (real − teórico)"
            value={reporte.consolidado.desviacion.valor}
            porcentaje={reporte.consolidado.desviacion.porcentaje}
            porcentajeSuffix="vs. el CMV teórico"
            negative={reporte.consolidado.desviacion.valor > 0}
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
              <th className="px-4 py-2">Inv. final sistema</th>
              <th className="px-4 py-2">Inv. final físico</th>
              <th className="px-4 py-2">CMV teórico</th>
              <th className="px-4 py-2">CMV real</th>
              <th className="px-4 py-2">Desviación</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : !reporte || reporte.detalle.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-neutral-400">
                  No hay artículos de materia prima activos.
                </td>
              </tr>
            ) : (
              reporte.detalle.map((item) => (
                <tr key={item.articuloId} className="border-t align-top">
                  <td className="px-4 py-2">
                    {item.articuloNombre}{' '}
                    <span className="text-xs text-neutral-400">({item.articuloCodigo})</span>
                  </td>
                  <td className="px-4 py-2">{formatCOP(item.inventarioInicialValue)}</td>
                  <td className="px-4 py-2">{formatCOP(item.comprasValue)}</td>
                  <td className="px-4 py-2">{formatCOP(item.inventarioFinalSistemaValue)}</td>
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
                  <td className="px-4 py-2">{formatCOP(item.cmvTeoricoValue)}</td>
                  <td className="px-4 py-2">{formatCOP(item.cmvRealValue)}</td>
                  <td className="px-4 py-2">
                    <span className={item.desviacionValue > 0 ? 'text-red-600' : ''}>
                      {formatCOP(item.desviacionValue)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!readOnly && (
                      <button
                        onClick={() => setFinalFisicoFor(item)}
                        className="text-orange-600 hover:underline"
                      >
                        {item.inventarioFinalFisicoRegistrado ? 'Editar' : 'Registrar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {finalFisicoFor && (
        <InventarioFinalFisicoModal
          articulo={finalFisicoFor}
          fecha={end}
          onClose={() => setFinalFisicoFor(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
