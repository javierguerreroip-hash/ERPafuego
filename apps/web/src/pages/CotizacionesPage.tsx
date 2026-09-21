import { useEffect, useState } from 'react';
import {
  COTIZACION_CONDICIONES_DEFAULT,
  COTIZACION_ICONOS,
  COTIZACION_ICONO_LABELS,
  cotizacionSchema,
  type ClienteDTO,
  type CotizacionDTO,
  type CotizacionIcono,
  type CotizacionInput,
  type CotizacionLineaInput,
  type OpcionMenuDTO,
  type TaxRateDTO,
  type VendedorDisponibleDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { generateCotizacionPDF } from '../lib/cotizacion-pdf';
import { Field, inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

function emptyLinea(): CotizacionLineaInput {
  return { descripcion: '', cantidad: 1, valorUnitario: 0 };
}

function emptyForm(): CotizacionInput {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    asunto: '',
    lugar: '',
    numeroPersonas: 1,
    clienteId: '',
    items: [emptyLinea()],
    logistica: [],
    taxRateId: null,
    condicionesComerciales: COTIZACION_CONDICIONES_DEFAULT,
    vendedorId: '',
    icono: null,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumaLineas(lineas: CotizacionLineaInput[]): number {
  return round2(lineas.reduce((sum, l) => sum + l.cantidad * l.valorUnitario, 0));
}

export function CotizacionesPage() {
  const { token } = useAuth();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [cotizaciones, setCotizaciones] = useState<CotizacionDTO[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRateDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [vendedores, setVendedores] = useState<VendedorDisponibleDTO[]>([]);
  const [opcionesMenu, setOpcionesMenu] = useState<OpcionMenuDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CotizacionInput>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [cotizacionesData, taxRatesData, clientesData, vendedoresData, opcionesData] =
        await Promise.all([
          apiFetch<CotizacionDTO[]>('/cotizaciones', { token }),
          apiFetch<TaxRateDTO[]>('/tax-rates', { token }),
          apiFetch<ClienteDTO[]>('/clientes', { token }),
          apiFetch<VendedorDisponibleDTO[]>('/negocios/vendedores', { token }),
          apiFetch<OpcionMenuDTO[]>('/opciones-menu', { token }),
        ]);
      setCotizaciones(cotizacionesData);
      setTaxRates(taxRatesData.filter((t) => t.active));
      setClientes(clientesData.filter((c) => c.active));
      setVendedores(vendedoresData);
      setOpcionesMenu(opcionesData.filter((o) => o.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNueva() {
    setForm(emptyForm());
    setFormError(null);
    setView('form');
  }

  function updateItem(index: number, patch: Partial<CotizacionLineaInput>) {
    setForm({
      ...form,
      items: form.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  }

  function updateLogistica(index: number, patch: Partial<CotizacionLineaInput>) {
    setForm({
      ...form,
      logistica: form.logistica.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  }

  const subtotalItems = sumaLineas(form.items);
  const subtotalLogistica = sumaLineas(form.logistica);
  const subtotal = round2(subtotalItems + subtotalLogistica);
  const taxRateSeleccionada = taxRates.find((t) => t.id === form.taxRateId);
  const impuestoValor = round2(subtotal * (taxRateSeleccionada?.rate ?? 0));
  const total = round2(subtotal + impuestoValor);

  async function handleSubmit() {
    setFormError(null);
    const parsed = cotizacionSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/cotizaciones', { method: 'POST', body: parsed.data, token });
      setView('list');
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar la cotización');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadFromForm() {
    const clienteSeleccionado = clientes.find((c) => c.id === form.clienteId);
    const vendedorSeleccionado = vendedores.find((v) => v.id === form.vendedorId);
    await generateCotizacionPDF({
      fecha: form.fecha,
      asunto: form.asunto || 'Cotización',
      lugar: form.lugar,
      numeroPersonas: form.numeroPersonas,
      clienteNombre: clienteSeleccionado?.name || 'cliente',
      items: form.items,
      logistica: form.logistica,
      totales: {
        subtotalItems,
        subtotalLogistica,
        subtotal,
        impuestoValor,
        impuestoPorcentaje: taxRateSeleccionada?.rate ?? 0,
        total,
      },
      condicionesComerciales: form.condicionesComerciales,
      vendedorNombre: vendedorSeleccionado?.name || '',
      taxRateNombre: taxRateSeleccionada?.name ?? null,
      icono: form.icono,
    });
  }

  async function handleDownloadSaved(cotizacion: CotizacionDTO) {
    setDownloadingId(cotizacion.id);
    try {
      await generateCotizacionPDF({
        fecha: cotizacion.fecha.slice(0, 10),
        asunto: cotizacion.asunto,
        lugar: cotizacion.lugar,
        numeroPersonas: cotizacion.numeroPersonas,
        clienteNombre: cotizacion.clienteNombre,
        items: cotizacion.items,
        logistica: cotizacion.logistica,
        totales: cotizacion.totales,
        condicionesComerciales: cotizacion.condicionesComerciales,
        vendedorNombre: cotizacion.vendedorNombre,
        taxRateNombre: cotizacion.taxRateNombre,
        icono: cotizacion.icono,
      });
    } finally {
      setDownloadingId(null);
    }
  }

  if (view === 'form') {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Nueva cotización</h1>
            <p className="text-sm text-neutral-500">
              Al guardar, se crea automáticamente un negocio "Cotizado" en el CRM.
            </p>
          </div>
          <button
            onClick={() => setView('list')}
            className="rounded-md px-4 py-2 text-sm text-neutral-600 hover:underline"
          >
            Volver al listado
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Datos del evento</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha">
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Lugar">
                  <input
                    value={form.lugar}
                    onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Asunto (plato/momento principal)">
                  <input
                    value={form.asunto}
                    onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                    className={inputClass}
                    placeholder="Ej. Paella Marinera"
                  />
                </Field>
                <Field label="Número de invitados">
                  <input
                    type="number"
                    min={1}
                    value={form.numeroPersonas}
                    onChange={(e) => setForm({ ...form, numeroPersonas: Number(e.target.value) })}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Cliente</h2>
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
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-700">Ítems del menú</h2>
                <button
                  onClick={() => setForm({ ...form, items: [...form.items, emptyLinea()] })}
                  className="text-sm text-orange-600 hover:underline"
                >
                  + Agregar ítem
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => {
                  const opcionSeleccionada = opcionesMenu.find((o) => o.name === item.descripcion);
                  return (
                  <div key={index} className="grid grid-cols-12 items-end gap-2">
                    <div className="col-span-6">
                      <select
                        value={opcionSeleccionada?.id ?? ''}
                        onChange={(e) => {
                          const opcion = opcionesMenu.find((o) => o.id === e.target.value);
                          if (opcion) {
                            updateItem(index, { descripcion: opcion.name, valorUnitario: opcion.price });
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="" disabled>
                          Selecciona una opción de menú…
                        </option>
                        {opcionesMenu.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({formatCOP(o.price)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, { cantidad: Number(e.target.value) })}
                        className={inputClass}
                        placeholder="Cant."
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        value={item.valorUnitario}
                        onChange={(e) =>
                          updateItem(index, { valorUnitario: Number(e.target.value) })
                        }
                        className={inputClass}
                        placeholder="Vr. unitario"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() =>
                          setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
                        }
                        disabled={form.items.length === 1}
                        className="text-neutral-400 hover:text-red-600 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
              <p className="mt-3 text-right text-sm font-medium text-neutral-700">
                Sub-total: {formatCOP(subtotalItems)}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-700">Logística</h2>
                <button
                  onClick={() =>
                    setForm({ ...form, logistica: [...form.logistica, emptyLinea()] })
                  }
                  className="text-sm text-orange-600 hover:underline"
                >
                  + Agregar ítem
                </button>
              </div>
              {form.logistica.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Sin ítems de logística (cocinero, transporte, meseros…).
                </p>
              )}
              <div className="space-y-2">
                {form.logistica.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 items-end gap-2">
                    <div className="col-span-6">
                      <input
                        value={item.descripcion}
                        onChange={(e) => updateLogistica(index, { descripcion: e.target.value })}
                        className={inputClass}
                        placeholder="Descripción"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        value={item.cantidad}
                        onChange={(e) =>
                          updateLogistica(index, { cantidad: Number(e.target.value) })
                        }
                        className={inputClass}
                        placeholder="Cant."
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        value={item.valorUnitario}
                        onChange={(e) =>
                          updateLogistica(index, { valorUnitario: Number(e.target.value) })
                        }
                        className={inputClass}
                        placeholder="Vr. unitario"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() =>
                          setForm({
                            ...form,
                            logistica: form.logistica.filter((_, i) => i !== index),
                          })
                        }
                        className="text-neutral-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {form.logistica.length > 0 && (
                <p className="mt-3 text-right text-sm font-medium text-neutral-700">
                  Sub-total: {formatCOP(subtotalLogistica)}
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Condiciones comerciales</h2>
              <textarea
                value={form.condicionesComerciales}
                onChange={(e) => setForm({ ...form, condicionesComerciales: e.target.value })}
                rows={4}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Firma e ilustración</h2>
              <div className="space-y-3">
                <Field label="Vendedor (firma)">
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
                <Field label="Ilustración">
                  <select
                    value={form.icono ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        icono: (e.target.value || null) as CotizacionIcono | null,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">Sin ilustración</option>
                    {COTIZACION_ICONOS.map((icono) => (
                      <option key={icono} value={icono}>
                        {COTIZACION_ICONO_LABELS[icono]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Impuesto">
                  <select
                    value={form.taxRateId ?? ''}
                    onChange={(e) => setForm({ ...form, taxRateId: e.target.value || null })}
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
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-700">Totales</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {taxRateSeleccionada ? taxRateSeleccionada.name : 'Impuesto'}
                  </span>
                  <span>{formatCOP(impuestoValor)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadFromForm}
                className="rounded-md border border-orange-600 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
              >
                Descargar vista previa (PDF)
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Guardar cotización'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Cotizaciones</h1>
          <p className="text-sm text-neutral-500">
            Se exportan a PDF con el diseño de A Fuego y crean automáticamente el negocio en el
            CRM.
          </p>
        </div>
        <button
          onClick={openNueva}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nueva cotización
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Asunto</th>
              <th className="px-4 py-2">Vendedor</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : cotizaciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no hay cotizaciones.
                </td>
              </tr>
            ) : (
              cotizaciones.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">
                    {new Date(`${c.fecha.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-2">{c.clienteNombre}</td>
                  <td className="px-4 py-2">{c.asunto}</td>
                  <td className="px-4 py-2">{c.vendedorNombre}</td>
                  <td className="px-4 py-2 font-medium">{formatCOP(c.totales.total)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDownloadSaved(c)}
                      disabled={downloadingId === c.id}
                      className="text-orange-600 hover:underline disabled:opacity-60"
                    >
                      {downloadingId === c.id ? 'Generando…' : 'Descargar PDF'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
