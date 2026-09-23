import { useEffect, useState } from 'react';
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ARTICULO_CATEGORIA_LABELS, type DashboardDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { KpiCard } from '../components/KpiCard';
import { ExportButtons } from '../components/ExportButtons';
import { formatCOP } from '../lib/format';

const EXPORT_COLUMNS = [
  { key: 'indicador', label: 'Indicador' },
  { key: 'valor', label: 'Valor (COP)' },
  { key: 'porcentaje', label: '%' },
];

const CATEGORY_COLORS: Record<string, string> = {
  MATERIA_PRIMA: '#ea580c',
  MANO_DE_OBRA: '#0ea5e9',
  SERVICIO_TRANSPORTE: '#16a34a',
  SERVICIOS_ARTISTICOS: '#a855f7',
  ALQUILER_MENAJE_EQUIPOS: '#64748b',
};

export function DashboardPage() {
  const { token } = useAuth();
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<DashboardDTO>(`/dashboard?start=${start}&end=${end}`, { token })
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, [start, end, token]);

  const composicionData =
    dashboard?.composicionCostos
      .filter((item) => item.valor > 0)
      .map((item) => ({ name: ARTICULO_CATEGORIA_LABELS[item.categoria], value: item.valor })) ?? [];

  // Costos + Utilidad operativa suman el 100% de Ventas totales — se
  // grafica esa descomposición (no las 3 cifras por separado, porque
  // Ventas ya es la suma de las otras dos y triplicaría el total).
  // Si la utilidad es negativa la torta pierde sentido (una porción no
  // puede ser "menos que nada"), así que en ese caso se omite y se deja
  // solo el mensaje con la cifra real.
  const resumenData =
    dashboard && dashboard.utilidadOperativa.valor >= 0
      ? [
          { name: 'Costos totales', value: dashboard.costosTotales.valor, color: '#ea580c' },
          { name: 'Utilidad operativa', value: dashboard.utilidadOperativa.valor, color: '#16a34a' },
        ].filter((item) => item.value > 0)
      : [];

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard General</h1>
          <p className="text-sm text-neutral-500">
            Ventas, costos y utilidad de los eventos del período, alimentados por los Módulos 1 y
            3.
          </p>
        </div>
        {dashboard && (
          <ExportButtons
            filename={`dashboard_${start}_${end}`}
            title="Dashboard General"
            subtitle={`Período: ${start} a ${end}`}
            columns={EXPORT_COLUMNS}
            rows={[
              { indicador: 'Ventas totales', valor: formatCOP(dashboard.ventasTotales), porcentaje: '' },
              {
                indicador: 'Costos totales',
                valor: formatCOP(dashboard.costosTotales.valor),
                porcentaje: `${dashboard.costosTotales.porcentaje.toFixed(1)}%`,
              },
              {
                indicador: 'Utilidad operativa',
                valor: formatCOP(dashboard.utilidadOperativa.valor),
                porcentaje: `${dashboard.utilidadOperativa.porcentaje.toFixed(1)}%`,
              },
              {
                indicador: 'CMV (materia prima)',
                valor: formatCOP(dashboard.cmvMateriaPrima.valor),
                porcentaje: `${dashboard.cmvMateriaPrima.porcentaje.toFixed(1)}%`,
              },
              {
                indicador: 'Mano de obra tercerizada',
                valor: formatCOP(dashboard.manoDeObra.valor),
                porcentaje: `${dashboard.manoDeObra.porcentaje.toFixed(1)}%`,
              },
              {
                indicador: 'Servicios de transporte',
                valor: formatCOP(dashboard.serviciosTransporte.valor),
                porcentaje: `${dashboard.serviciosTransporte.porcentaje.toFixed(1)}%`,
              },
              {
                indicador: 'Servicios artísticos',
                valor: formatCOP(dashboard.serviciosArtisticos.valor),
                porcentaje: `${dashboard.serviciosArtisticos.porcentaje.toFixed(1)}%`,
              },
              ...dashboard.comprasMonitoreo.map((item) => ({
                indicador: `Compras de ${ARTICULO_CATEGORIA_LABELS[item.categoria]} (monitoreo, no afecta costos)`,
                valor: formatCOP(item.valor),
                porcentaje: '',
              })),
            ]}
          />
        )}
      </div>

      <PeriodPickerControls filter={filter} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mb-4 text-sm text-neutral-400">Cargando…</p>}

      {dashboard && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Ventas totales" value={dashboard.ventasTotales} highlight />
            <KpiCard
              label="Costos totales"
              value={dashboard.costosTotales.valor}
              porcentaje={dashboard.costosTotales.porcentaje}
            />
            <KpiCard
              label="Utilidad operativa"
              value={dashboard.utilidadOperativa.valor}
              porcentaje={dashboard.utilidadOperativa.porcentaje}
              negative={dashboard.utilidadOperativa.valor < 0}
            />
            <KpiCard
              label="CMV (materia prima)"
              value={dashboard.cmvMateriaPrima.valor}
              porcentaje={dashboard.cmvMateriaPrima.porcentaje}
            />
            <KpiCard
              label="Mano de obra tercerizada"
              value={dashboard.manoDeObra.valor}
              porcentaje={dashboard.manoDeObra.porcentaje}
            />
            <KpiCard
              label="Servicios de transporte"
              value={dashboard.serviciosTransporte.valor}
              porcentaje={dashboard.serviciosTransporte.porcentaje}
            />
            <KpiCard
              label="Servicios artísticos"
              value={dashboard.serviciosArtisticos.valor}
              porcentaje={dashboard.serviciosArtisticos.porcentaje}
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {dashboard.comprasMonitoreo.map((item) => (
              <div key={item.categoria}>
                <KpiCard
                  label={`Compras de ${ARTICULO_CATEGORIA_LABELS[item.categoria]}`}
                  value={item.valor}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Solo monitoreo — no incluido en costos ni utilidad operativa.
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">
                Ventas: costos vs. utilidad operativa
              </h2>
              {resumenData.length === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-400">
                  {dashboard.utilidadOperativa.valor < 0
                    ? `Utilidad negativa en este período (${formatCOP(dashboard.utilidadOperativa.valor)}).`
                    : 'Sin ventas registradas en este período.'}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={resumenData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {resumenData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCOP(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">
                Composición de costos por categoría
              </h2>
              {composicionData.length === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-400">
                  Sin consumos cargados en este período.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={composicionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {dashboard.composicionCostos
                        .filter((item) => item.valor > 0)
                        .map((item) => (
                          <Cell key={item.categoria} fill={CATEGORY_COLORS[item.categoria]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCOP(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">
                Tendencia de ventas y utilidad
              </h2>
              {dashboard.tendencia.length === 0 ? (
                <p className="py-10 text-center text-sm text-neutral-400">
                  Sin eventos registrados en este período.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dashboard.tendencia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(value: string) =>
                        new Date(`${value}T00:00:00`).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                        })
                      }
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCOP(value)}
                      labelFormatter={(value: string) =>
                        new Date(`${value}T00:00:00`).toLocaleDateString('es-CO')
                      }
                    />
                    <Legend />
                    <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#ea580c" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="utilidad"
                      name="Utilidad"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
