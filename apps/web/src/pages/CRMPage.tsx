import { useEffect, useState } from 'react';
import {
  ETAPAS_NEGOCIO,
  ETAPA_NEGOCIO_LABELS,
  negocioSchema,
  type EtapaNegocio,
  type NegocioDTO,
  type NegocioInput,
  type OpcionMenuDTO,
  type TaxRateDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { GanarNegocioModal } from '../components/GanarNegocioModal';
import { Field, inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

function emptyForm(): NegocioInput {
  return {
    clienteNombre: '',
    clienteIdentificacion: '',
    telefono: '',
    nombreEvento: '',
    fechaEvento: new Date().toISOString().slice(0, 10),
    valorAntesImpuestos: 0,
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
  const [opcionesMenu, setOpcionesMenu] = useState<OpcionMenuDTO[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NegocioDTO | null>(null);
  const [form, setForm] = useState<NegocioInput>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [ganarFor, setGanarFor] = useState<NegocioDTO | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [negociosData, opcionesData, taxRatesData] = await Promise.all([
        apiFetch<NegocioDTO[]>('/negocios', { token }),
        apiFetch<OpcionMenuDTO[]>('/opciones-menu', { token }),
        apiFetch<TaxRateDTO[]>('/tax-rates', { token }),
      ]);
      setNegocios(negociosData);
      setOpcionesMenu(opcionesData.filter((o) => o.active));
      setTaxRates(taxRatesData.filter((t) => t.active));
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

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(negocio: NegocioDTO) {
    setEditing(negocio);
    setForm({
      clienteNombre: negocio.clienteNombre,
      clienteIdentificacion: negocio.clienteIdentificacion,
      telefono: negocio.telefono,
      nombreEvento: negocio.nombreEvento,
      fechaEvento: negocio.fechaEvento.slice(0, 10),
      valorAntesImpuestos: negocio.valorAntesImpuestos,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = negocioSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await apiFetch(`/negocios/${editing.id}`, { method: 'PUT', body: parsed.data, token });
      } else {
        await apiFetch('/negocios', { method: 'POST', body: parsed.data, token });
      }
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePerder(negocio: NegocioDTO) {
    try {
      await apiFetch(`/negocios/${negocio.id}/perder`, { method: 'PATCH', token });
      await loadAll();
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
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nuevo negocio
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ETAPAS_NEGOCIO.map((etapa) => {
            const items = negocios.filter((n) => n.etapa === etapa);
            return (
              <div key={etapa} className={`rounded-lg border-2 bg-neutral-50 p-3 ${COLUMN_STYLES[etapa]}`}>
                <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                  {ETAPA_NEGOCIO_LABELS[etapa]} ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <p className="text-xs text-neutral-400">Sin negocios en esta etapa.</p>
                  )}
                  {items.map((n) => (
                    <div key={n.id} className="rounded-md border bg-white p-3 shadow-sm">
                      <p className="text-sm font-medium text-neutral-900">{n.clienteNombre}</p>
                      <p className="text-xs text-neutral-500">{n.nombreEvento}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(n.fechaEvento).toLocaleDateString('es-CO')}
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">
                        {formatCOP(n.valorAntesImpuestos)}
                      </p>
                      <p className="text-xs text-neutral-400">Vendedor: {n.vendedorNombre}</p>

                      {etapa === 'COTIZADO' && (
                        <div className="mt-2 flex gap-3 text-xs">
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Editar negocio' : 'Nuevo negocio'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Nombre o razón social del cliente">
              <input
                value={form.clienteNombre}
                onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cédula/NIT (opcional)">
                <input
                  value={form.clienteIdentificacion}
                  onChange={(e) => setForm({ ...form, clienteIdentificacion: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
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

      {ganarFor && (
        <GanarNegocioModal
          negocio={ganarFor}
          opcionesMenu={opcionesMenu}
          taxRates={taxRates}
          onClose={() => setGanarFor(null)}
          onGanado={loadAll}
        />
      )}
    </div>
  );
}
