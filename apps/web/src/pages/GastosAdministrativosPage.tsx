import { useEffect, useState } from 'react';
import {
  GASTO_ADMINISTRATIVO_RUBROS,
  GASTO_ADMINISTRATIVO_RUBRO_LABELS,
  gastoAdministrativoSchema,
  type GastoAdministrativoDTO,
  type GastoAdministrativoInput,
  type GastoAdministrativoRubro,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Field, inputClass } from '../components/Field';
import { ExportButtons } from '../components/ExportButtons';
import { formatCOP } from '../lib/format';

const EXPORT_COLUMNS = [
  { key: 'rubro', label: 'Rubro' },
  { key: 'valor', label: 'Valor (COP)' },
];

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function emptyForm(year: number, month: number): GastoAdministrativoInput {
  return {
    year,
    month,
    arriendo: 0,
    nomina: 0,
    serviciosPublicos: 0,
    honorariosContadorSocios: 0,
    controlPlagas: 0,
    seguros: 0,
    internet: 0,
    adicionales: 0,
    cuotaObligacionFinanciera: 0,
    publicidad: 0,
  };
}

export function GastosAdministrativosPage() {
  const { token } = useAuth();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [form, setForm] = useState<GastoAdministrativoInput>(() => {
    const [y, m] = currentYearMonth().split('-').map(Number);
    return emptyForm(y, m);
  });
  const [historial, setHistorial] = useState<GastoAdministrativoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadHistorial() {
    try {
      const data = await apiFetch<GastoAdministrativoDTO[]>('/gastos-administrativos', { token });
      setHistorial(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el histórico');
    }
  }

  async function loadMes(year: number, month: number) {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const gasto = await apiFetch<GastoAdministrativoDTO | null>(
        `/gastos-administrativos/mes?year=${year}&month=${month}`,
        { token },
      );
      if (gasto) {
        const rubroValues = Object.fromEntries(
          GASTO_ADMINISTRATIVO_RUBROS.map((rubro) => [rubro, gasto[rubro]]),
        ) as Record<GastoAdministrativoRubro, number>;
        setForm({ year: gasto.year, month: gasto.month, ...rubroValues });
      } else {
        setForm(emptyForm(year, month));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el mes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const [y, m] = yearMonth.split('-').map(Number);
    loadMes(y, m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth]);

  const total = GASTO_ADMINISTRATIVO_RUBROS.reduce((sum, rubro) => sum + (form[rubro] || 0), 0);

  async function handleSubmit() {
    setError(null);
    setSaved(false);
    const parsed = gastoAdministrativoSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/gastos-administrativos', { method: 'POST', body: parsed.data, token });
      setSaved(true);
      await loadHistorial();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Gastos Administrativos</h1>
          <p className="text-sm text-neutral-500">
            Registro mensual de gastos fijos — alimenta el Estado de Resultados.
          </p>
        </div>
        <ExportButtons
          filename={`gastos-administrativos_${yearMonth}`}
          title="Gastos Administrativos"
          subtitle={`Mes: ${yearMonth}`}
          columns={EXPORT_COLUMNS}
          rows={[
            ...GASTO_ADMINISTRATIVO_RUBROS.map((rubro) => ({
              rubro: GASTO_ADMINISTRATIVO_RUBRO_LABELS[rubro],
              valor: formatCOP(form[rubro] || 0),
            })),
            { rubro: 'Total', valor: formatCOP(total) },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 lg:col-span-2">
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Mes</label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className={`${inputClass} max-w-xs`}
            />
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-neutral-400">Cargando…</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GASTO_ADMINISTRATIVO_RUBROS.map((rubro) => (
                <Field key={rubro} label={GASTO_ADMINISTRATIVO_RUBRO_LABELS[rubro]}>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form[rubro]}
                    onChange={(e) =>
                      setForm({ ...form, [rubro]: Number(e.target.value) } as GastoAdministrativoInput)
                    }
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm font-medium text-neutral-900">
              Total del mes: {formatCOP(total)}
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {saved && <p className="mt-2 text-sm text-green-600">Guardado correctamente.</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-700">Histórico</h2>
          {historial.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin meses registrados todavía.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {historial.map((g) => (
                <li key={g.id}>
                  <button
                    onClick={() => setYearMonth(`${g.year}-${String(g.month).padStart(2, '0')}`)}
                    className="flex w-full justify-between rounded px-2 py-1 hover:bg-neutral-50"
                  >
                    <span>
                      {g.year}-{String(g.month).padStart(2, '0')}
                    </span>
                    <span className="text-neutral-500">{formatCOP(g.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
