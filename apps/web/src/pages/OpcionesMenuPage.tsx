import { useState } from 'react';
import {
  OPCION_MENU_CATEGORIAS,
  OPCION_MENU_CATEGORIA_LABELS,
  opcionMenuSchema,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  type OpcionMenuCategoria,
  type OpcionMenuDTO,
  type OpcionMenuInput,
  type PriceType,
} from '@erp-afuego/shared';
import { useResource } from '../hooks/useResource';
import { Modal } from '../components/Modal';
import { Field, FilterChip, inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

const EMPTY_FORM: OpcionMenuInput = {
  name: '',
  category: 'MOMENTOS_FUERTES',
  description: '',
  priceType: 'POR_PERSONA',
  price: 0,
};

export function OpcionesMenuPage() {
  const { items, loading, error, create, update, setActive } = useResource<
    OpcionMenuDTO,
    OpcionMenuInput
  >('/opciones-menu');
  const [categoryFilter, setCategoryFilter] = useState<OpcionMenuCategoria | 'TODAS'>('TODAS');
  const [editing, setEditing] = useState<OpcionMenuDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OpcionMenuInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = items.filter(
    (item) => categoryFilter === 'TODAS' || item.category === categoryFilter,
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item: OpcionMenuDTO) {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      priceType: item.priceType,
      price: item.price,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = opcionMenuSchema.safeParse(form);
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
          <h1 className="text-xl font-semibold text-neutral-900">Opciones de Menú</h1>
          <p className="text-sm text-neutral-500">Catálogo de venta — Carta 2026.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nueva opción
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          label="Todas"
          active={categoryFilter === 'TODAS'}
          onClick={() => setCategoryFilter('TODAS')}
        />
        {OPCION_MENU_CATEGORIAS.map((cat) => (
          <FilterChip
            key={cat}
            label={OPCION_MENU_CATEGORIA_LABELS[cat]}
            active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
          />
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Estado</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No hay opciones en esta categoría.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t align-top">
                  <td className="px-4 py-2">
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    {item.description && (
                      <p className="mt-0.5 max-w-md text-xs text-neutral-500">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">{OPCION_MENU_CATEGORIA_LABELS[item.category]}</td>
                  <td className="px-4 py-2">{formatCOP(item.price)}</td>
                  <td className="px-4 py-2">{PRICE_TYPE_LABELS[item.priceType]}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {item.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="space-x-3 px-4 py-2 text-right">
                    <button onClick={() => openEdit(item)} className="text-orange-600 hover:underline">
                      Editar
                    </button>
                    <button
                      onClick={() => setActive(item.id, !item.active)}
                      className="text-neutral-500 hover:underline"
                    >
                      {item.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? 'Editar opción de menú' : 'Nueva opción de menú'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Nombre">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Categoría">
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as OpcionMenuCategoria })
                }
                className={inputClass}
              >
                {OPCION_MENU_CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {OPCION_MENU_CATEGORIA_LABELS[cat]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descripción (ingredientes/composición)">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de precio">
                <select
                  value={form.priceType}
                  onChange={(e) => setForm({ ...form, priceType: e.target.value as PriceType })}
                  className={inputClass}
                >
                  {PRICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {PRICE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Precio (COP)">
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
    </div>
  );
}
