import { useState } from 'react';
import {
  ARTICULO_CATEGORIAS,
  ARTICULO_CATEGORIA_LABELS,
  proveedorSchema,
  type ArticuloCategoria,
  type ProveedorDTO,
  type ProveedorInput,
} from '@erp-afuego/shared';
import { useResource } from '../hooks/useResource';
import { Modal } from '../components/Modal';
import { Field, FilterChip, inputClass } from '../components/Field';

const EMPTY_FORM: ProveedorInput = {
  name: '',
  identificacion: '',
  telefono: '',
  correo: '',
  categoria: 'MATERIA_PRIMA',
};

export function ProveedoresPage() {
  const { items, loading, error, create, update, setActive } = useResource<
    ProveedorDTO,
    ProveedorInput
  >('/proveedores');
  const [categoryFilter, setCategoryFilter] = useState<ArticuloCategoria | 'TODAS'>('TODAS');
  const [editing, setEditing] = useState<ProveedorDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProveedorInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = items.filter(
    (item) => categoryFilter === 'TODAS' || item.categoria === categoryFilter,
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item: ProveedorDTO) {
    setEditing(item);
    setForm({
      name: item.name,
      identificacion: item.identificacion,
      telefono: item.telefono,
      correo: item.correo,
      categoria: item.categoria,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = proveedorSchema.safeParse(form);
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
          <h1 className="text-xl font-semibold text-neutral-900">Proveedores</h1>
          <p className="text-sm text-neutral-500">
            Quienes suministran materia prima, mano de obra, transporte, arte o menaje.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nuevo proveedor
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          label="Todas"
          active={categoryFilter === 'TODAS'}
          onClick={() => setCategoryFilter('TODAS')}
        />
        {ARTICULO_CATEGORIAS.map((cat) => (
          <FilterChip
            key={cat}
            label={ARTICULO_CATEGORIA_LABELS[cat]}
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
              <th className="px-4 py-2">Nombre / Razón social</th>
              <th className="px-4 py-2">NIT</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
                  No hay proveedores en esta categoría.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.identificacion}</td>
                  <td className="px-4 py-2">{item.telefono || '—'}</td>
                  <td className="px-4 py-2">{item.correo || '—'}</td>
                  <td className="px-4 py-2">{ARTICULO_CATEGORIA_LABELS[item.categoria]}</td>
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
        <Modal
          title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
          onClose={() => setShowForm(false)}
        >
          <div className="space-y-3">
            <Field label="Nombre o razón social">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="NIT">
              <input
                value={form.identificacion}
                onChange={(e) => setForm({ ...form, identificacion: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono">
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Correo">
                <input
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Categoría de lo que provee">
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value as ArticuloCategoria })
                }
                className={inputClass}
              >
                {ARTICULO_CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {ARTICULO_CATEGORIA_LABELS[cat]}
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
    </div>
  );
}
