import { useEffect, useState } from 'react';
import { turnoAdminSchema, type LiquidacionQuincenalDTO, type TurnoAdminInput } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { Modal } from '../components/Modal';
import { ExportButtons } from '../components/ExportButtons';
import { Field, inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

const EXPORT_COLUMNS = [
  { key: 'concepto', label: 'Concepto' },
  { key: 'horas', label: 'Horas' },
  { key: 'valor', label: 'Valor (COP)' },
];

interface Empleado {
  id: string;
  name: string;
  active: boolean;
}

const CONCEPTO_LABELS: Record<keyof LiquidacionQuincenalDTO['desglose'], string> = {
  diurnaOrdinaria: 'Horas diurnas',
  nocturnaOrdinaria: 'Horas nocturnas',
  extraDiurna: 'Horas extra diurnas',
  extraNocturna: 'Horas extra nocturnas',
  dominicalFestivaDiurna: 'Horas dominicales/festivas',
  dominicalFestivaNocturna: 'Horas dominicales/festivas nocturnas',
  extraDiurnaDominicalFestiva: 'Horas extra dominicales/festivas',
  extraNocturnaDominicalFestiva: 'Horas extra dominicales/festivas nocturnas',
};

// Colombia no tiene horario de verano (UTC-5 fijo) — se convierte de forma
// explícita en vez de usar la hora local del navegador, para que el turno
// se registre en hora Colombia sin importar dónde esté el operador o el
// servidor.
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;

function toColombiaInput(iso: string): string {
  const d = new Date(new Date(iso).getTime() - COLOMBIA_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function fromColombiaInput(localValue: string): string {
  // "2026-01-05T18:00" (hora Colombia) -> ISO real con el offset explícito.
  return `${localValue}:00-05:00`;
}

export function NominaLiquidacionPage() {
  const { token } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const filter = usePeriodFilter('QUINCENA');
  const { start, end } = filter;

  const [liquidacion, setLiquidacion] = useState<LiquidacionQuincenalDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTurnoForm, setShowTurnoForm] = useState(false);
  const [turnoForm, setTurnoForm] = useState<TurnoAdminInput>({
    userId: '',
    horaEntrada: '',
    horaSalida: null,
  });
  const [turnoFormError, setTurnoFormError] = useState<string | null>(null);
  const [editingTurnoId, setEditingTurnoId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Empleado[]>('/nomina/empleados', { token })
      .then((data) => {
        setEmpleados(data);
        if (data.length > 0) setEmpleadoId(data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar empleados'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLiquidacion() {
    if (!empleadoId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LiquidacionQuincenalDTO>(
        `/nomina/liquidacion?userId=${empleadoId}&start=${start}&end=${end}`,
        { token },
      );
      setLiquidacion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la liquidación');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLiquidacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadoId, start, end]);

  function openNewTurno() {
    setEditingTurnoId(null);
    setTurnoForm({ userId: empleadoId, horaEntrada: '', horaSalida: null });
    setTurnoFormError(null);
    setShowTurnoForm(true);
  }

  function openEditTurno(turnoId: string, horaEntrada: string, horaSalida: string | null) {
    setEditingTurnoId(turnoId);
    setTurnoForm({
      userId: empleadoId,
      horaEntrada: toColombiaInput(horaEntrada),
      horaSalida: horaSalida ? toColombiaInput(horaSalida) : null,
    });
    setTurnoFormError(null);
    setShowTurnoForm(true);
  }

  async function handleSaveTurno() {
    setTurnoFormError(null);
    const payload: TurnoAdminInput = {
      userId: turnoForm.userId,
      horaEntrada: turnoForm.horaEntrada ? fromColombiaInput(turnoForm.horaEntrada) : '',
      horaSalida: turnoForm.horaSalida ? fromColombiaInput(turnoForm.horaSalida) : null,
    };
    const parsed = turnoAdminSchema.safeParse(payload);
    if (!parsed.success) {
      setTurnoFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    try {
      if (editingTurnoId) {
        await apiFetch(`/nomina/turnos/${editingTurnoId}`, { method: 'PUT', body: parsed.data, token });
      } else {
        await apiFetch('/nomina/turnos', { method: 'POST', body: parsed.data, token });
      }
      setShowTurnoForm(false);
      await loadLiquidacion();
    } catch (err) {
      setTurnoFormError(err instanceof Error ? err.message : 'Error al guardar el turno');
    }
  }

  async function handleDeleteTurno(turnoId: string) {
    try {
      await apiFetch(`/nomina/turnos/${turnoId}`, { method: 'DELETE', token });
      await loadLiquidacion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el turno');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Liquidación de Nómina</h1>
          <p className="text-sm text-neutral-500">
            Desglose de horas y valor a pagar por empleado y período.
          </p>
        </div>
        {liquidacion && (
          <ExportButtons
            filename={`liquidacion_${liquidacion.empleadoNombre}_${start}_${end}`}
            title={`Liquidación de Nómina — ${liquidacion.empleadoNombre}`}
            subtitle={`Período: ${start} a ${end}`}
            columns={EXPORT_COLUMNS}
            rows={[
              ...(Object.keys(CONCEPTO_LABELS) as (keyof LiquidacionQuincenalDTO['desglose'])[])
                .filter((k) => liquidacion.desglose[k] > 0)
                .map((k) => ({
                  concepto: CONCEPTO_LABELS[k],
                  horas: liquidacion.desglose[k],
                  valor: formatCOP(liquidacion.valorPorConcepto[k]),
                })),
              {
                concepto: `Auxilio de transporte (${liquidacion.diasTrabajados} días)`,
                horas: '',
                valor: formatCOP(liquidacion.auxilioTransporte),
              },
              { concepto: 'Total a pagar', horas: '', valor: formatCOP(liquidacion.totalAPagar) },
            ]}
          />
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Empleado</label>
          <select
            value={empleadoId}
            onChange={(e) => setEmpleadoId(e.target.value)}
            className={`${inputClass} min-w-[200px]`}
          >
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
                {!e.active ? ' (inactivo)' : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={openNewTurno}
          disabled={!empleadoId}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
        >
          Registrar/corregir turno
        </button>
      </div>

      <PeriodPickerControls filter={filter} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {empleados.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No hay empleados con rol Cocina/Nómina todavía. Créalos en el módulo de usuarios.
        </p>
      ) : loading || !liquidacion ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border bg-white">
            {(Object.keys(CONCEPTO_LABELS) as (keyof LiquidacionQuincenalDTO['desglose'])[])
              .filter((k) => liquidacion.desglose[k] > 0)
              .map((k) => (
                <div key={k} className="flex items-center justify-between border-t px-4 py-2 text-sm">
                  <span className="text-neutral-600">{CONCEPTO_LABELS[k]}</span>
                  <span>
                    {liquidacion.desglose[k]}h · {formatCOP(liquidacion.valorPorConcepto[k])}
                  </span>
                </div>
              ))}
            <div className="flex items-center justify-between border-t px-4 py-2 text-sm">
              <span className="text-neutral-600">
                Auxilio de transporte ({liquidacion.diasTrabajados} días)
              </span>
              <span>{formatCOP(liquidacion.auxilioTransporte)}</span>
            </div>
            <div className="flex items-center justify-between border-t bg-orange-50 px-4 py-3">
              <span className="font-semibold text-neutral-900">Total a pagar</span>
              <span className="font-semibold text-neutral-900">{formatCOP(liquidacion.totalAPagar)}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Entrada</th>
                  <th className="px-3 py-2">Salida</th>
                  <th className="px-3 py-2">Horas</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {liquidacion.turnos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-neutral-400">
                      Sin turnos en este período.
                    </td>
                  </tr>
                ) : (
                  liquidacion.turnos.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-3 py-2">{new Date(t.horaEntrada).toLocaleString('es-CO')}</td>
                      <td className="px-3 py-2">
                        {t.horaSalida ? new Date(t.horaSalida).toLocaleString('es-CO') : '—'}
                      </td>
                      <td className="px-3 py-2">{t.horasTrabajadas ?? '—'}</td>
                      <td className="space-x-2 px-3 py-2 text-right">
                        <button
                          onClick={() => openEditTurno(t.id, t.horaEntrada, t.horaSalida)}
                          className="text-orange-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTurno(t.id)}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTurnoForm && (
        <Modal title={editingTurnoId ? 'Editar turno' : 'Nuevo turno'} onClose={() => setShowTurnoForm(false)}>
          <div className="space-y-3">
            <Field label="Hora de entrada">
              <input
                type="datetime-local"
                value={turnoForm.horaEntrada}
                onChange={(e) => setTurnoForm({ ...turnoForm, horaEntrada: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Hora de salida (opcional — vacío = turno abierto)">
              <input
                type="datetime-local"
                value={turnoForm.horaSalida ?? ''}
                onChange={(e) => setTurnoForm({ ...turnoForm, horaSalida: e.target.value || null })}
                className={inputClass}
              />
            </Field>

            {turnoFormError && <p className="text-sm text-red-600">{turnoFormError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTurnoForm(false)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTurno}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
