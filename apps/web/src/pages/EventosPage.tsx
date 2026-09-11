import { useEffect, useState } from 'react';
import {
  eventoSchema,
  type ClienteDTO,
  type EventoDTO,
  type EventoInput,
  type OpcionMenuDTO,
  type RankingOpcionesReporteDTO,
  type TaxRateDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { Modal } from '../components/Modal';
import { EventoDetailModal } from '../components/EventoDetailModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Field, inputClass } from '../components/Field';
import { formatCOP, formatDateOnly } from '../lib/format';

function emptyForm(): EventoInput {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    clienteId: '',
    opcionMenuId: '',
    numeroPersonas: 1,
    valorAntesImpuestos: 0,
    taxRateId: null,
  };
}

export function EventosPage() {
  const { token } = useAuth();
  const [eventos, setEventos] = useState<EventoDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [opcionesMenu, setOpcionesMenu] = useState<OpcionMenuDTO[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventoInput>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [openEventoId, setOpenEventoId] = useState<string | null>(null);
  const [deletingEvento, setDeletingEvento] = useState<EventoDTO | null>(null);

  const rankingFilter = usePeriodFilter('MES');
  const { start: rankingStart, end: rankingEnd } = rankingFilter;
  const [ranking, setRanking] = useState<RankingOpcionesReporteDTO | null>(null);
  const [rankingLoading, setRankingLoading] = useState(true);

  async function loadRanking() {
    setRankingLoading(true);
    try {
      const data = await apiFetch<RankingOpcionesReporteDTO>(
        `/eventos/ranking-opciones?start=${rankingStart}&end=${rankingEnd}`,
        { token },
      );
      setRanking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el ranking de opciones');
    } finally {
      setRankingLoading(false);
    }
  }

  useEffect(() => {
    loadRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankingStart, rankingEnd]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [eventosData, clientesData, opcionesData, taxRatesData] = await Promise.all([
        apiFetch<EventoDTO[]>('/eventos', { token }),
        apiFetch<ClienteDTO[]>('/clientes', { token }),
        apiFetch<OpcionMenuDTO[]>('/opciones-menu', { token }),
        apiFetch<TaxRateDTO[]>('/tax-rates', { token }),
      ]);
      setEventos(eventosData);
      setClientes(clientesData);
      setOpcionesMenu(opcionesData);
      setTaxRates(taxRatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeClientes = clientes.filter((c) => c.active);
  const activeOpciones = opcionesMenu.filter((o) => o.active);
  const activeTaxRates = taxRates.filter((t) => t.active);

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = eventoSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch<EventoDTO>('/eventos', { method: 'POST', body: parsed.data, token });
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el evento');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Ventas y Costos por Evento</h1>
          <p className="text-sm text-neutral-500">
            Doble clic sobre un evento para cargar sus consumos de materia prima y servicios.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nuevo evento
        </button>
      </div>

      <div className="mb-4 rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-700">
          Ranking de opciones vendidas
        </h2>
        <PeriodPickerControls filter={rankingFilter} />

        {rankingLoading || !ranking ? (
          <p className="py-6 text-center text-sm text-neutral-400">Cargando…</p>
        ) : ranking.ranking.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Sin eventos registrados en este período.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-neutral-600">
              Total de personas atendidas en el período:{' '}
              <span className="font-semibold text-neutral-900">
                {ranking.totalPersonasAtendidas}
              </span>
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Opción de menú</th>
                    <th className="px-3 py-2">Unidades vendidas</th>
                    <th className="px-3 py-2">Personas atendidas</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.ranking.map((r, index) => (
                    <tr key={r.opcionMenuId} className="border-t">
                      <td className="px-3 py-2 text-neutral-400">{index + 1}</td>
                      <td className="px-3 py-2">{r.opcionMenuNombre}</td>
                      <td className="px-3 py-2 font-medium">{r.unidadesVendidas}</td>
                      <td className="px-3 py-2">{r.personasAtendidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Opción de menú</th>
              <th className="px-4 py-2">Personas</th>
              <th className="px-4 py-2">Valor antes de imp.</th>
              <th className="px-4 py-2">Valor después de imp.</th>
              <th className="px-4 py-2">Costo total</th>
              <th className="px-4 py-2">Utilidad operacional</th>
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
            ) : eventos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no hay eventos registrados.
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr
                  key={evento.id}
                  onDoubleClick={() => setOpenEventoId(evento.id)}
                  className="cursor-pointer border-t hover:bg-neutral-50"
                  title="Doble clic para ver el detalle y cargar consumos"
                >
                  <td className="px-4 py-2">{formatDateOnly(evento.fecha)}</td>
                  <td className="px-4 py-2">{evento.clienteNombre}</td>
                  <td className="px-4 py-2">{evento.opcionMenuNombre}</td>
                  <td className="px-4 py-2">{evento.numeroPersonas}</td>
                  <td className="px-4 py-2">{formatCOP(evento.valorAntesImpuestos)}</td>
                  <td className="px-4 py-2">{formatCOP(evento.valorDespuesImpuestos)}</td>
                  <td className="px-4 py-2">
                    {formatCOP(evento.costoTotal)}{' '}
                    <span className="text-xs text-neutral-400">
                      ({evento.costoTotalPorcentaje.toFixed(1)}%)
                    </span>
                  </td>
                  <td
                    className={`px-4 py-2 ${evento.utilidadOperacional < 0 ? 'text-red-600' : ''}`}
                  >
                    {formatCOP(evento.utilidadOperacional)}{' '}
                    <span className="text-xs text-neutral-400">
                      ({evento.utilidadOperacionalPorcentaje.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingEvento(evento);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nuevo evento" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del evento">
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Número de personas">
                <input
                  type="number"
                  min={1}
                  value={form.numeroPersonas}
                  onChange={(e) => setForm({ ...form, numeroPersonas: Number(e.target.value) })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Cliente">
              <select
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecciona…</option>
                {activeClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Opción de menú vendida">
              <select
                value={form.opcionMenuId}
                onChange={(e) => setForm({ ...form, opcionMenuId: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecciona…</option>
                {activeOpciones.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({formatCOP(o.price)})
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor antes de impuestos">
                <input
                  type="number"
                  min={0}
                  value={form.valorAntesImpuestos}
                  onChange={(e) =>
                    setForm({ ...form, valorAntesImpuestos: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Tasa de impuesto">
                <select
                  value={form.taxRateId ?? ''}
                  onChange={(e) => setForm({ ...form, taxRateId: e.target.value || null })}
                  className={inputClass}
                >
                  <option value="">Sin impuesto</option>
                  {activeTaxRates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Guardar evento'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {openEventoId && (
        <EventoDetailModal
          eventoId={openEventoId}
          onClose={() => setOpenEventoId(null)}
          onChanged={loadAll}
        />
      )}

      {deletingEvento && (
        <ConfirmDeleteModal
          title="Eliminar venta"
          message={`Vas a eliminar definitivamente el evento de "${deletingEvento.clienteNombre}" (${formatDateOnly(deletingEvento.fecha)}). Esto solo funciona si no tiene abonos/pagos registrados en Cartera. Si vino de un negocio ganado en el CRM, ese negocio vuelve a "Cotizado".`}
          onConfirm={async (password) => {
            await apiFetch(`/eventos/${deletingEvento.id}`, {
              method: 'DELETE',
              body: { password },
              token,
            });
            setDeletingEvento(null);
            await loadAll();
          }}
          onClose={() => setDeletingEvento(null)}
        />
      )}
    </div>
  );
}
