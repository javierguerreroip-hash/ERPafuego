import { useState } from 'react';
import {
  ARTICULO_CATEGORIAS,
  ARTICULO_CATEGORIA_LABELS,
  articuloSchema,
  type ArticuloCategoria,
  type ArticuloDTO,
  type ArticuloInput,
} from '@erp-afuego/shared';
import { useResource } from '../hooks/useResource';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Modal } from '../components/Modal';
import { ArticuloPriceHistoryModal } from '../components/ArticuloPriceHistoryModal';
import { BulkImportModal, type ImportColumn } from '../components/BulkImportModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Field, FilterChip, inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

const EMPTY_FORM: ArticuloInput = {
  code: '',
  name: '',
  category: 'MATERIA_PRIMA',
  unit: '',
};

// Acepta tanto el valor exacto del enum ("MATERIA_PRIMA") como su etiqueta
// en español ("Materia prima") para que la plantilla de Excel sea legible
// para el usuario sin dejar de coincidir con lo que espera el backend.
function resolveArticuloCategoria(raw: string): string {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if ((ARTICULO_CATEGORIAS as readonly string[]).includes(normalized)) return normalized;
  const byLabel = Object.entries(ARTICULO_CATEGORIA_LABELS).find(
    ([, label]) => label.toLowerCase() === raw.trim().toLowerCase(),
  );
  return byLabel ? byLabel[0] : raw;
}

const IMPORT_COLUMNS: ImportColumn[] = [
  { header: 'Código', field: 'code' },
  { header: 'Nombre', field: 'name' },
  { header: 'Categoría', field: 'category', parse: resolveArticuloCategoria },
  { header: 'Unidad', field: 'unit' },
];

export function ArticulosPage() {
  const { token } = useAuth();
  const { items, loading, error, create, update, setActive, refresh } = useResource<
    ArticuloDTO,
    ArticuloInput
  >('/articulos');
  const [categoryFilter, setCategoryFilter] = useState<ArticuloCategoria | 'TODAS'>('TODAS');
  const [editing, setEditing] = useState<ArticuloDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [historyFor, setHistoryFor] = useState<ArticuloDTO | null>(null);
  const [deletingArticulo, setDeletingArticulo] = useState<ArticuloDTO | null>(null);
  const [form, setForm] = useState<ArticuloInput>(EMPTY_FORM);
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

  function openEdit(item: ArticuloDTO) {
    setEditing(item);
    setForm({ code: item.code, name: item.name, category: item.category, unit: item.unit });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = articuloSchema.safeParse(form);
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
          <h1 className="text-xl font-semibold text-neutral-900">Artículos y Servicios</h1>
          <p className="text-sm text-neutral-500">
            Materia prima, mano de obra, transporte, servicios artísticos y alquiler de menaje.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-md border border-orange-600 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            Cargar desde Excel
          </button>
          <button
            onClick={openCreate}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Nuevo artículo
          </button>
        </div>
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
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Unidad</th>
              <th className="px-4 py-2">Último precio de compra</th>
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
                  No hay artículos en esta categoría.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{ARTICULO_CATEGORIA_LABELS[item.category]}</td>
                  <td className="px-4 py-2">{item.unit}</td>
                  <td className="px-4 py-2">
                    {item.lastPurchasePrice > 0
                      ? formatCOP(item.lastPurchasePrice)
                      : '— (sin compras aún)'}
                  </td>
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
                    <button
                      onClick={() => setHistoryFor(item)}
                      className="text-neutral-500 hover:underline"
                    >
                      Ver histórico
                    </button>
                    <button onClick={() => openEdit(item)} className="text-orange-600 hover:underline">
                      Editar
                    </button>
                    <button
                      onClick={() => setActive(item.id, !item.active)}
                      className="text-neutral-500 hover:underline"
                    >
                      {item.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => setDeletingArticulo(item)}
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
        <Modal title={editing ? 'Editar artículo' : 'Nuevo artículo'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Código">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className={inputClass}
              />
            </Field>
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
                  setForm({ ...form, category: e.target.value as ArticuloCategoria })
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
            <Field label="Unidad de medida">
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className={inputClass}
                placeholder="kg, und, lt…"
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

      {historyFor && (
        <ArticuloPriceHistoryModal articulo={historyFor} onClose={() => setHistoryFor(null)} />
      )}

      {showImport && (
        <BulkImportModal<ArticuloInput>
          title="Cargar artículos desde Excel"
          columns={IMPORT_COLUMNS}
          schema={articuloSchema}
          onCreateOne={create}
          onClose={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false);
            refresh();
          }}
        />
      )}

      {deletingArticulo && (
        <ConfirmDeleteModal
          title="Eliminar artículo"
          message={`Vas a eliminar definitivamente "${deletingArticulo.name}". Esto solo funciona si el artículo nunca se usó en compras, consumos o inventarios — si ya tiene historial, desactívalo en su lugar.`}
          onConfirm={async (password) => {
            await apiFetch(`/articulos/${deletingArticulo.id}`, {
              method: 'DELETE',
              body: { password },
              token,
            });
            setDeletingArticulo(null);
            await refresh();
          }}
          onClose={() => setDeletingArticulo(null)}
        />
      )}
    </div>
  );
}
