import { useEffect, useState } from 'react';
import type { LiquidacionQuincenalDTO, TurnoDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { formatCOP } from '../lib/format';

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

export function MiTurnoPage() {
  const { token, user } = useAuth();
  const [turnoAbierto, setTurnoAbierto] = useState<TurnoDTO | null>(null);
  const [misTurnos, setMisTurnos] = useState<TurnoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filter = usePeriodFilter('QUINCENA');
  const { start, end } = filter;
  const [liquidacion, setLiquidacion] = useState<LiquidacionQuincenalDTO | null>(null);
  const [loadingLiquidacion, setLoadingLiquidacion] = useState(true);

  async function loadTurnos() {
    setLoading(true);
    setError(null);
    try {
      const turnos = await apiFetch<TurnoDTO[]>('/nomina/turnos', { token });
      setMisTurnos(turnos);
      setTurnoAbierto(turnos.find((t) => t.horaSalida === null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  }

  async function loadLiquidacion() {
    setLoadingLiquidacion(true);
    try {
      const data = await apiFetch<LiquidacionQuincenalDTO>(
        `/nomina/liquidacion?start=${start}&end=${end}`,
        { token },
      );
      setLiquidacion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la liquidación');
    } finally {
      setLoadingLiquidacion(false);
    }
  }

  useEffect(() => {
    loadTurnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLiquidacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  async function handleMarcarEntrada() {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/nomina/turnos/marcar-entrada', { method: 'POST', token });
      await loadTurnos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar entrada');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarcarSalida() {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/nomina/turnos/marcar-salida', { method: 'PUT', body: {}, token });
      await loadTurnos();
      await loadLiquidacion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar salida');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-neutral-900">Mi Turno</h1>
        <p className="text-sm text-neutral-500">Hola, {user?.name}. Registra tu entrada y salida por turno.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 rounded-lg border bg-white p-4">
        {loading ? (
          <p className="text-sm text-neutral-400">Cargando…</p>
        ) : turnoAbierto ? (
          <div>
            <p className="mb-3 text-sm text-neutral-600">
              Turno abierto desde{' '}
              <span className="font-medium text-neutral-900">
                {new Date(turnoAbierto.horaEntrada).toLocaleString('es-CO')}
              </span>
            </p>
            <button
              onClick={handleMarcarSalida}
              disabled={submitting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : 'Marcar salida'}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-neutral-600">No tienes un turno abierto en este momento.</p>
            <button
              onClick={handleMarcarEntrada}
              disabled={submitting}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : 'Marcar entrada'}
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Entrada</th>
              <th className="px-4 py-2">Salida</th>
              <th className="px-4 py-2">Horas</th>
            </tr>
          </thead>
          <tbody>
            {misTurnos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no tienes turnos registrados.
                </td>
              </tr>
            ) : (
              misTurnos.slice(0, 15).map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2">{new Date(t.horaEntrada).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-2">
                    {t.horaSalida ? new Date(t.horaSalida).toLocaleString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-2">{t.horasTrabajadas ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-neutral-900">Mi liquidación</h2>
      <PeriodPickerControls filter={filter} />

      {loadingLiquidacion ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : (
        liquidacion && (
          <div className="max-w-xl overflow-hidden rounded-lg border bg-white">
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
        )
      )}
    </div>
  );
}
