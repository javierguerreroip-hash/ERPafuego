import { useState } from 'react';
import { taxRateSchema, type TaxRateDTO, type TaxRateInput } from '@erp-afuego/shared';
import { useResource } from '../hooks/useResource';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Field, inputClass } from '../components/Field';

const EMPTY_FORM: TaxRateInput = { name: '', rate: 0 };

export function TaxRatesPage() {
  const { user } = useAuth();
  // Administrador, Operación y Ventas tienen acceso completo (decisión del
  // negocio); solo Cocina/Nómina no ve este módulo (ni el enlace en el menú).
  const isAdmin = user?.role !== 'COCINA_NOMINA';
  const { items, loading, error, create, update, setActive } = useResource<
    TaxRateDTO,
    TaxRateInput
  >('/tax-rates');
  const [editing, setEditing] = useState<TaxRateDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TaxRateInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item: TaxRateDTO) {
    setEditing(item);
    setForm({ name: item.name, rate: item.rate });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = taxRateSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await update(editing.id, parsed.data);
      } else {
        await create(parsed.data);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Parámetros Fiscales</h1>
          <p className="text-sm text-neutral-500">
            Tasas de impuesto para calcular el valor después de impuestos en eventos.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Nueva tarifa
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tasa</th>
              <th className="px-4 py-2">Estado</th>
              {isAdmin && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                  No hay tarifas configuradas.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{(item.rate * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {item.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="space-x-3 px-4 py-2 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-orange-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setActive(item.id, !item.active)}
                        className="text-neutral-500 hover:underline"
                      >
                        {item.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? 'Editar tarifa' : 'Nueva tarifa'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Nombre">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="IVA 19%"
              />
            </Field>
            <Field label="Tasa (como fracción, ej. 0.19 = 19%)">
              <input
                type="number"
                min={0}
                max={1}
                step="0.0001"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                className={inputClass}
              />
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
    </div>
  );
}
