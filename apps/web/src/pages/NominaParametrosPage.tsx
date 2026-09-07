import { useEffect, useState } from 'react';
import {
  diaFestivoSchema,
  parametroNominaSchema,
  type DiaFestivoDTO,
  type DiaFestivoInput,
  type ParametroNominaDTO,
  type ParametroNominaInput,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Field, inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

const RECARGO_FIELDS: { key: keyof ParametroNominaInput; label: string }[] = [
  { key: 'recargoNocturno', label: 'Recargo nocturno' },
  { key: 'recargoExtraDiurna', label: 'Hora extra diurna' },
  { key: 'recargoExtraNocturna', label: 'Hora extra nocturna' },
  { key: 'recargoDominicalFestiva', label: 'Dominical/festiva ordinaria' },
  { key: 'recargoNocturnoDomFestivo', label: 'Nocturno en dominical/festivo' },
  { key: 'recargoExtraDiurnaDomFestiva', label: 'Extra diurna dominical/festiva' },
  { key: 'recargoExtraNocturnaDomFestiva', label: 'Extra nocturna dominical/festiva' },
];

function toForm(p: ParametroNominaDTO): ParametroNominaInput {
  return {
    smlv: p.smlv,
    divisorHoras: p.divisorHoras,
    auxilioTransporte: p.auxilioTransporte,
    recargoNocturno: p.recargoNocturno,
    recargoExtraDiurna: p.recargoExtraDiurna,
    recargoExtraNocturna: p.recargoExtraNocturna,
    recargoDominicalFestiva: p.recargoDominicalFestiva,
    recargoNocturnoDomFestivo: p.recargoNocturnoDomFestivo,
    recargoExtraDiurnaDomFestiva: p.recargoExtraDiurnaDomFestiva,
    recargoExtraNocturnaDomFestiva: p.recargoExtraNocturnaDomFestiva,
  };
}

export function NominaParametrosPage() {
  const { token } = useAuth();
  const [parametros, setParametros] = useState<ParametroNominaDTO | null>(null);
  const [form, setForm] = useState<ParametroNominaInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [festivos, setFestivos] = useState<DiaFestivoDTO[]>([]);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [festivoError, setFestivoError] = useState<string | null>(null);

  async function loadParametros() {
    setLoading(true);
    try {
      const data = await apiFetch<ParametroNominaDTO>('/nomina/parametros', { token });
      setParametros(data);
      setForm(toForm(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los parámetros');
    } finally {
      setLoading(false);
    }
  }

  async function loadFestivos() {
    try {
      const data = await apiFetch<DiaFestivoDTO[]>('/nomina/festivos', { token });
      setFestivos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los festivos');
    }
  }

  useEffect(() => {
    loadParametros();
    loadFestivos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!form) return;
    setError(null);
    setSaved(false);
    const parsed = parametroNominaSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await apiFetch<ParametroNominaDTO>('/nomina/parametros', {
        method: 'PUT',
        body: parsed.data,
        token,
      });
      setParametros(updated);
      setForm(toForm(updated));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddFestivo() {
    setFestivoError(null);
    const payload: DiaFestivoInput = { fecha: nuevaFecha, nombre: nuevoNombre };
    const parsed = diaFestivoSchema.safeParse(payload);
    if (!parsed.success) {
      setFestivoError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    try {
      await apiFetch('/nomina/festivos', { method: 'POST', body: parsed.data, token });
      setNuevaFecha('');
      setNuevoNombre('');
      await loadFestivos();
    } catch (err) {
      setFestivoError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  async function handleDeleteFestivo(id: string) {
    try {
      await apiFetch(`/nomina/festivos/${id}`, { method: 'DELETE', token });
      await loadFestivos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el festivo');
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-neutral-900">Parámetros de Nómina</h1>
        <p className="text-sm text-neutral-500">
          Recargos legales, SMLV y días festivos — nunca fijos en el código, se actualizan aquí.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          {loading || !form ? (
            <p className="text-sm text-neutral-400">Cargando…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="SMLV mensual (COP)">
                  <input
                    type="number"
                    min={0}
                    value={form.smlv}
                    onChange={(e) => setForm({ ...form, smlv: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Divisor de horas mensuales">
                  <input
                    type="number"
                    min={1}
                    value={form.divisorHoras}
                    onChange={(e) => setForm({ ...form, divisorHoras: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Auxilio de transporte mensual (COP)">
                  <input
                    type="number"
                    min={0}
                    value={form.auxilioTransporte}
                    onChange={(e) => setForm({ ...form, auxilioTransporte: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
              </div>

              {parametros && (
                <p className="mt-2 text-xs text-neutral-500">
                  Valor hora ordinaria calculado: {formatCOP(parametros.valorHoraOrdinaria)}
                </p>
              )}

              <p className="mb-2 mt-4 text-sm font-medium text-neutral-700">
                Recargos (% sobre la hora ordinaria)
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {RECARGO_FIELDS.map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        step="0.01"
                        value={Math.round(form[key] * 10000) / 100}
                        onChange={(e) =>
                          setForm({ ...form, [key]: Number(e.target.value) / 100 } as ParametroNominaInput)
                        }
                        className={inputClass}
                      />
                      <span className="text-sm text-neutral-500">%</span>
                    </div>
                  </Field>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                {saved && <p className="text-sm text-green-600">Guardado correctamente.</p>}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="ml-auto rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {submitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-700">Días festivos</h2>
          <div className="mb-3 flex gap-2">
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Nombre (opcional)"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className={inputClass}
            />
            <button
              onClick={handleAddFestivo}
              className="whitespace-nowrap rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Agregar
            </button>
          </div>
          {festivoError && <p className="mb-2 text-sm text-red-600">{festivoError}</p>}

          {festivos.length === 0 ? (
            <p className="text-sm text-neutral-400">No hay festivos registrados.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {festivos.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-neutral-50">
                  <span>
                    {f.fecha} {f.nombre && <span className="text-neutral-500">— {f.nombre}</span>}
                  </span>
                  <button
                    onClick={() => handleDeleteFestivo(f.id)}
                    className="text-neutral-400 hover:text-red-600"
                  >
                    Quitar
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
