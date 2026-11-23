import { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ETAPAS_NEGOCIO,
  ETAPA_NEGOCIO_LABELS,
  negocioGanadoUpdateSchema,
  negocioSchema,
  type ClienteDTO,
  type CotizacionDTO,
  type CrmResumenDTO,
  type EtapaNegocio,
  type NegocioDTO,
  type NegocioGanadoUpdateInput,
  type NegocioInput,
  type OpcionMenuDTO,
  type TaxRateDTO,
  type VendedorDisponibleDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { Modal } from '../components/Modal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { GanarNegocioModal } from '../components/GanarNegocioModal';
import { CotizacionDetalleModal } from '../components/CotizacionDetalleModal';
import { KpiCard } from '../components/KpiCard';
import { Field, inputClass } from '../components/Field';
import { formatCOP, formatDateOnly } from '../lib/format';

const ETAPA_COLORS: Record<EtapaNegocio, string> = {
  COTIZADO: '#64748b',
  GANADO: '#16a34a',
  PERDIDO: '#dc2626',
};

function emptyForm(vendedorId: string): NegocioInput {
  return {
    clienteId: '',
    nombreEvento: '',
    fechaEvento: new Date().toISOString().slice(0, 10),
    valorAntesImpuestos: 0,
    vendedorId,
  };
}

const COLUMN_STYLES: Record<EtapaNegocio, string> = {
  COTIZADO: 'border-neutral-200',
  GANADO: 'border-green-200',
  PERDIDO: 'border-red-200',
};

export function CRMPage() {
  const { token } = useAuth();
  const [negocios, setNegocios] = useState<NegocioDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [opcionesMenu, setOpcionesMenu] = useState<OpcionMenuDTO[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRateDTO[]>([]);
  const [vendedores, setVendedores] = useState<VendedorDisponibleDTO[]>([]);
  // Cotizaciones por negocio (propuesta 001): cada negocio nace de una
  // cotización y desde aquí se puede ver completa.
  const [cotizacionPorNegocio, setCotizacionPorNegocio] = useState<Map<string, CotizacionDTO>>(new Map());
  const [verCotizacion, setVerCotizacion] = useState<CotizacionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NegocioDTO | null>(null);
  const [form, setForm] = useState<NegocioInput>(emptyForm(''));
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [ganarFor, setGanarFor] = useState<NegocioDTO | null>(null);
  const [deletingNegocio, setDeletingNegocio] = useState<NegocioDTO | null>(null);
  const [search, setSearch] = useState('');

  const [editingGanado, setEditingGanado] = useState<NegocioDTO | null>(null);
  const [ganadoForm, setGanadoForm] = useState<NegocioGanadoUpdateInput | null>(null);
  const [ganadoFormError, setGanadoFormError] = useState<string | null>(null);
  const [ganadoSubmitting, setGanadoSubmitting] = useState(false);

  const resumenFilter = usePeriodFilter('MES');
  const { start: resumenStart, end: resumenEnd } = resumenFilter;
  const [resumen, setResumen] = useState<CrmResumenDTO | null>(null);
  const [resumenLoading, setResumenLoading] = useState(true);

  async function loadResumen() {
    setResumenLoading(true);
    try {
      const data = await apiFetch<CrmResumenDTO>(
        `/negocios/resumen?start=${resumenStart}&end=${resumenEnd}`,
        { token },
      );
      setResumen(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el resumen del CRM');
    } finally {
      setResumenLoading(false);
    }
  }

  useEffect(() => {
    loadResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumenStart, resumenEnd]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [negociosData, clientesData, opcionesData, taxRatesData, vendedoresData, cotizacionesData] =
        await Promise.all([
          apiFetch<NegocioDTO[]>('/negocios', { token }),
          apiFetch<ClienteDTO[]>('/clientes', { token }),
          apiFetch<OpcionMenuDTO[]>('/opciones-menu', { token }),
          apiFetch<TaxRateDTO[]>('/tax-rates', { token }),
          apiFetch<VendedorDisponibleDTO[]>('/negocios/vendedores', { token }),
          apiFetch<CotizacionDTO[]>('/cotizaciones', { token }),
        ]);
      setNegocios(negociosData);
      setCotizacionPorNegocio(
        new Map(
          cotizacionesData
            .filter((c): c is CotizacionDTO & { negocioId: string } => c.negocioId !== null)
            .map((c): [string, CotizacionDTO] => [c.negocioId, c]),
        ),
      );
      setClientes(clientesData.filter((c) => c.active));
      setOpcionesMenu(opcionesData.filter((o) => o.active));
      setTaxRates(taxRatesData.filter((t) => t.active));
      setVendedores(vendedoresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el CRM');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresco combinado tras crear/editar/ganar/perder/eliminar un negocio:
  // el Kanban (loadAll) y la gráfica de resumen (loadResumen) son datos
  // independientes en el servidor, así que una acción que cambia un
  // negocio debe refrescar ambos — si no, la gráfica se queda mostrando
  // el estado de antes de la acción hasta que se toque el filtro de período.
  async function refresh() {
    await Promise.all([loadAll(), loadResumen()]);
  }


  function openEdit(negocio: NegocioDTO) {
    setEditing(negocio);
    setForm({
      clienteId: negocio.clienteId ?? '',
      nombreEvento: negocio.nombreEvento,
      fechaEvento: negocio.fechaEvento.slice(0, 10),
      valorAntesImpuestos: negocio.valorAntesImpuestos,
      vendedorId: negocio.vendedorId,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    if (!editing) return;
    const parsed = negocioSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/negocios/${editing.id}`, { method: 'PUT', body: parsed.data, token });
      setShowForm(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditGanado(negocio: NegocioDTO) {
    setEditingGanado(negocio);
    setGanadoForm({
      valorAntesImpuestos: negocio.valorAntesImpuestos,
      numeroPersonas: negocio.numeroPersonas ?? 1,
      opciones: negocio.opciones.map((o) => ({
        opcionMenuId: o.opcionMenuId,
        numeroPersonas: o.numeroPersonas,
      })),
      taxRateId: negocio.taxRateId,
      vendedorId: negocio.vendedorId,
      fechaEvento: negocio.fechaEvento.slice(0, 10),
      horaServicio: negocio.horaServicio ?? '',
      direccion: negocio.direccion ?? '',
    });
    setGanadoFormError(null);
  }

  async function handleSubmitGanado() {
    if (!editingGanado || !ganadoForm) return;
    setGanadoFormError(null);
    const parsed = negocioGanadoUpdateSchema.safeParse(ganadoForm);
    if (!parsed.success) {
      setGanadoFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setGanadoSubmitting(true);
    try {
      await apiFetch(`/negocios/${editingGanado.id}/venta`, {
        method: 'PUT',
        body: parsed.data,
        token,
      });
      setEditingGanado(null);
      setGanadoForm(null);
      await refresh();
    } catch (err) {
      setGanadoFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGanadoSubmitting(false);
    }
  }

  // Referencia (propuesta 001, opción B): suma de cantidad × precio de lista de
  // las opciones elegidas. NO se aplica sola: el valor lo digita el usuario.
  const valorSugeridoListaGanado = (ganadoForm?.opciones ?? []).reduce((suma, linea) => {
    const opcion = opcionesMenu.find((o) => o.id === linea.opcionMenuId);
    return suma + (opcion ? opcion.price * linea.numeroPersonas : 0);
  }, 0);

  async function handlePerder(negocio: NegocioDTO) {
    try {
      await apiFetch(`/negocios/${negocio.id}/perder`, { method: 'PATCH', token });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como perdido');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">CRM de Ventas</h1>
          <p className="text-sm text-neutral-500">
            Cotizado → Ganado (crea el evento en Ventas y Costos) o Perdido.
          </p>
          <p className="text-xs text-neutral-400">
            Los negocios nacen al guardar una cotización (módulo de Cotizaciones).
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, evento o vendedor…"
          className={`${inputClass} max-w-sm`}
        />
      </div>

      <PeriodPickerControls filter={resumenFilter} />

      <div className="mb-4 rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-700">
          Resumen comercial — Cotizado, Ganado y Perdido
        </h2>

        {resumenLoading || !resumen ? (
          <p className="py-6 text-center text-sm text-neutral-400">Cargando…</p>
        ) : resumen.totalCotizado === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Sin negocios (fecha de evento) en este período.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={resumen.porEtapa.filter((p) => p.valor > 0)}
                    dataKey="valor"
                    nameKey="etapa"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {resumen.porEtapa
                      .filter((p) => p.valor > 0)
                      .map((p) => (
                        <Cell key={p.etapa} fill={ETAPA_COLORS[p.etapa]} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCOP(value)} />
                  <Legend formatter={(value: string) => ETAPA_NEGOCIO_LABELS[value as EtapaNegocio]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs text-neutral-600">
                {resumen.porEtapa.map((p) => (
                  <div key={p.etapa}>
                    <p className="font-medium" style={{ color: ETAPA_COLORS[p.etapa] }}>
                      {ETAPA_NEGOCIO_LABELS[p.etapa]}
                    </p>
                    <p>{p.cantidad} cotización(es)</p>
                    <p>{formatCOP(p.valor)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <KpiCard label="Total cotizado (todas las etapas)" value={resumen.totalCotizado} highlight />
              <KpiCard label="Total ganado" value={resumen.totalGanado} />
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xs text-neutral-500">Eficiencia comercial</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {resumen.eficiencia.toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-400">Ganado ÷ total cotizado</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ETAPAS_NEGOCIO.map((etapa) => {
            const q = search.trim().toLowerCase();
            const items = negocios.filter((n) => {
              if (n.etapa !== etapa) return false;
              // El mismo período del resumen filtra las columnas, por la fecha
              // del evento (antes mostraban negocios de todos los meses).
              const dia = n.fechaEvento.slice(0, 10);
              if (dia < resumenStart || dia > resumenEnd) return false;
              if (!q) return true;
              return (
                n.clienteNombre.toLowerCase().includes(q) ||
                n.nombreEvento.toLowerCase().includes(q) ||
                n.vendedorNombre.toLowerCase().includes(q)
              );
            });
            return (
              <div key={etapa} className={`rounded-lg border-2 bg-neutral-50 p-3 ${COLUMN_STYLES[etapa]}`}>
                <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                  {ETAPA_NEGOCIO_LABELS[etapa]} ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <p className="text-xs text-neutral-400">
                      {q ? 'Ninguno coincide con la búsqueda.' : 'Sin negocios en esta etapa en el período.'}
                    </p>
                  )}
                  {items.map((n) => (
                    <div key={n.id} className="rounded-md border bg-white p-3 shadow-sm">
                      <p className="text-sm font-medium text-neutral-900">{n.clienteNombre}</p>
                      <p className="text-xs text-neutral-500">{n.nombreEvento}</p>
                      <p className="text-xs text-neutral-500">{formatDateOnly(n.fechaEvento)}</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">
                        {formatCOP(n.valorAntesImpuestos)}
                      </p>
                      <p className="text-xs text-neutral-400">Vendedor: {n.vendedorNombre}</p>
                      {cotizacionPorNegocio.get(n.id) ? (
                        <button
                          onClick={() => setVerCotizacion(cotizacionPorNegocio.get(n.id) ?? null)}
                          className="mt-1 text-xs text-neutral-600 underline hover:text-orange-600"
                        >
                          Ver cotización
                        </button>
                      ) : (
                        <p className="mt-1 text-xs text-neutral-300">Sin cotización (histórico)</p>
                      )}

                      {etapa === 'COTIZADO' && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          <button onClick={() => openEdit(n)} className="text-orange-600 hover:underline">
                            Editar
                          </button>
                          <button
                            onClick={() => setGanarFor(n)}
                            className="text-green-600 hover:underline"
                          >
                            Marcar Ganado
                          </button>
                          <button
                            onClick={() => handlePerder(n)}
                            className="text-red-600 hover:underline"
                          >
                            Marcar Perdido
                          </button>
                        </div>
                      )}

                      {etapa === 'GANADO' && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          <button
                            onClick={() => openEditGanado(n)}
                            className="text-orange-600 hover:underline"
                          >
                            Editar cambios del cliente
                          </button>
                        </div>
                      )}

                      {etapa !== 'GANADO' && (
                        <div className="mt-2 flex gap-3 text-xs">
                          <button
                            onClick={() => setDeletingNegocio(n)}
                            className="text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {verCotizacion && (
        <CotizacionDetalleModal cotizacion={verCotizacion} onClose={() => setVerCotizacion(null)} />
      )}

      {showForm && (
        <Modal title="Editar negocio" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Cliente">
              <select
                value={form.clienteId}
                onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                className={inputClass}
              >
                <option value="" disabled>
                  Selecciona un cliente…
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {clientes.length === 0 && (
                <p className="mt-1 text-xs text-neutral-400">
                  No hay clientes creados todavía — créalo primero en el módulo de Clientes.
                </p>
              )}
            </Field>
            <Field label="Evento">
              <input
                value={form.nombreEvento}
                onChange={(e) => setForm({ ...form, nombreEvento: e.target.value })}
                className={inputClass}
                placeholder="Ej. Boda, cumpleaños 50 años, evento corporativo…"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del evento">
                <input
                  type="date"
                  value={form.fechaEvento}
                  onChange={(e) => setForm({ ...form, fechaEvento: e.target.value })}
                  className={inputClass}
                />
              </Field>
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
            </div>
            <Field label="Vendedor">
              <select
                value={form.vendedorId}
                onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
                className={inputClass}
              >
                <option value="" disabled>
                  Selecciona un vendedor…
                </option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>

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
                {submitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editingGanado && ganadoForm && (
        <Modal
          title="Editar cambios del cliente (negocio ganado)"
          onClose={() => setEditingGanado(null)}
        >
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Aquí se editan los datos comerciales de la venta de "{editingGanado.clienteNombre}":
              se actualizan a la vez el negocio, la Venta y la Agenda.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del evento">
                <input
                  type="date"
                  value={ganadoForm.fechaEvento}
                  onChange={(e) => setGanadoForm({ ...ganadoForm, fechaEvento: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Número de personas">
                <input
                  type="number"
                  min={1}
                  value={ganadoForm.numeroPersonas}
                  onChange={(e) =>
                    setGanadoForm({ ...ganadoForm, numeroPersonas: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-700">Opciones de menú vendidas</p>
              <div className="space-y-2">
                {(ganadoForm.opciones ?? []).map((linea, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={linea.opcionMenuId}
                      onChange={(e) =>
                        setGanadoForm({
                          ...ganadoForm,
                          opciones: (ganadoForm.opciones ?? []).map((l, i) =>
                            i === index ? { ...l, opcionMenuId: e.target.value } : l,
                          ),
                        })
                      }
                      className={`${inputClass} flex-1`}
                    >
                      <option value="">Selecciona…</option>
                      {opcionesMenu.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({formatCOP(o.price)})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={linea.numeroPersonas}
                      onChange={(e) =>
                        setGanadoForm({
                          ...ganadoForm,
                          opciones: (ganadoForm.opciones ?? []).map((l, i) =>
                            i === index ? { ...l, numeroPersonas: Number(e.target.value) } : l,
                          ),
                        })
                      }
                      className={`${inputClass} w-24`}
                      aria-label="Personas o unidades"
                    />
                    <button
                      onClick={() =>
                        setGanadoForm({
                          ...ganadoForm,
                          opciones: (ganadoForm.opciones ?? []).filter((_, i) => i !== index),
                        })
                      }
                      disabled={(ganadoForm.opciones ?? []).length <= 1}
                      className="text-neutral-400 hover:text-red-600 disabled:opacity-30"
                      aria-label="Quitar opción"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  setGanadoForm({
                    ...ganadoForm,
                    opciones: [...(ganadoForm.opciones ?? []), { opcionMenuId: '', numeroPersonas: ganadoForm.numeroPersonas }],
                  })
                }
                className="mt-2 text-sm text-orange-600 hover:underline"
              >
                + Agregar otra opción de menú
              </button>
              <p className="mt-1 text-xs text-neutral-400">
                El número junto a cada opción son las personas o unidades de esa opción.
              </p>
            </div>
            <Field label="Valor antes de impuestos">
              <input
                type="number"
                min={0}
                value={ganadoForm.valorAntesImpuestos}
                onChange={(e) =>
                  setGanadoForm({ ...ganadoForm, valorAntesImpuestos: Number(e.target.value) })
                }
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-400">
                Referencia a precio de lista: {formatCOP(valorSugeridoListaGanado)}. El valor lo
                defines tú (lo negociado con el cliente).
              </p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tasa de impuesto">
                <select
                  value={ganadoForm.taxRateId ?? ''}
                  onChange={(e) => setGanadoForm({ ...ganadoForm, taxRateId: e.target.value || null })}
                  className={inputClass}
                >
                  <option value="">Sin impuesto</option>
                  {taxRates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Vendedor">
                <select
                  value={ganadoForm.vendedorId ?? ''}
                  onChange={(e) => setGanadoForm({ ...ganadoForm, vendedorId: e.target.value })}
                  className={inputClass}
                >
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora del servicio">
                <input
                  value={ganadoForm.horaServicio}
                  onChange={(e) => setGanadoForm({ ...ganadoForm, horaServicio: e.target.value })}
                  className={inputClass}
                  placeholder="Ej. 6:00 p.m."
                />
              </Field>
              <Field label="Dirección">
                <input
                  value={ganadoForm.direccion}
                  onChange={(e) => setGanadoForm({ ...ganadoForm, direccion: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            {ganadoFormError && <p className="text-sm text-red-600">{ganadoFormError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingGanado(null)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitGanado}
                disabled={ganadoSubmitting}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {ganadoSubmitting ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {ganarFor && (
        <GanarNegocioModal
          negocio={ganarFor}
          cotizacion={cotizacionPorNegocio.get(ganarFor.id) ?? null}
          opcionesMenu={opcionesMenu}
          taxRates={taxRates}
          onClose={() => setGanarFor(null)}
          onGanado={refresh}
        />
      )}

      {deletingNegocio && (
        <ConfirmDeleteModal
          title="Eliminar negocio"
          message={`Vas a eliminar definitivamente el negocio de "${deletingNegocio.clienteNombre}" (${deletingNegocio.nombreEvento}).`}
          onConfirm={async (password) => {
            await apiFetch(`/negocios/${deletingNegocio.id}`, {
              method: 'DELETE',
              body: { password },
              token,
            });
            setDeletingNegocio(null);
            await refresh();
          }}
          onClose={() => setDeletingNegocio(null)}
        />
      )}
    </div>
  );
}
