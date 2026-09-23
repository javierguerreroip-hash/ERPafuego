import { useState } from 'react';
import {
  CLIENTE_TIPOS,
  CLIENTE_TIPO_LABELS,
  clienteSchema,
  type ClienteDTO,
  type ClienteInput,
  type ClienteTipo,
} from '@erp-afuego/shared';
import { useResource } from '../hooks/useResource';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { BulkImportModal, type ImportColumn } from '../components/BulkImportModal';
import { ClienteArchivosSection } from '../components/ClienteArchivosSection';
import { Field, FilterChip, inputClass } from '../components/Field';

const EMPTY_FORM: ClienteInput = {
  name: '',
  identificacion: '',
  telefono: '',
  correo: '',
  direccion: '',
  ciudad: '',
  tipoCliente: 'PERSONA_NATURAL',
};

// Acepta tanto el valor exacto del enum como su etiqueta en español, para
// que la plantilla de Excel sea legible sin dejar de coincidir con lo
// que espera el backend (mismo patrón que categoría de Artículo).
function resolveClienteTipo(raw: string): string {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if ((CLIENTE_TIPOS as readonly string[]).includes(normalized)) return normalized;
  const byLabel = Object.entries(CLIENTE_TIPO_LABELS).find(
    ([, label]) => label.toLowerCase() === raw.trim().toLowerCase(),
  );
  return byLabel ? byLabel[0] : raw;
}

const IMPORT_COLUMNS: ImportColumn[] = [
  { header: 'Nombre / Razón social', field: 'name' },
  { header: 'Identificación', field: 'identificacion' },
  { header: 'Teléfono', field: 'telefono' },
  { header: 'Correo', field: 'correo' },
  { header: 'Dirección', field: 'direccion' },
  { header: 'Ciudad', field: 'ciudad' },
  { header: 'Tipo', field: 'tipoCliente', parse: resolveClienteTipo },
];

export function ClientesPage() {
  const { user } = useAuth();
  const readOnly = user?.role === 'CONSULTA';
  const { items, loading, error, create, update, setActive, refresh } = useResource<
    ClienteDTO,
    ClienteInput
  >('/clientes');
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<ClienteTipo | 'TODOS'>('TODOS');
  const [editing, setEditing] = useState<ClienteDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClienteInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = items.filter((item) => {
    if (tipoFilter !== 'TODOS' && item.tipoCliente !== tipoFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.identificacion.toLowerCase().includes(q);
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(item: ClienteDTO) {
    setEditing(item);
    setForm({
      name: item.name,
      identificacion: item.identificacion,
      telefono: item.telefono,
      correo: item.correo,
      direccion: item.direccion,
      ciudad: item.ciudad,
      tipoCliente: item.tipoCliente,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    setFormError(null);
    const parsed = clienteSchema.safeParse(form);
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
          <h1 className="text-xl font-semibold text-neutral-900">Clientes</h1>
          <p className="text-sm text-neutral-500">Personas o empresas a quienes se les cotizan eventos.</p>
        </div>
        {!readOnly && (
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
              Nuevo cliente
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o identificación…"
          className={`${inputClass} max-w-sm`}
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Todos"
            active={tipoFilter === 'TODOS'}
            onClick={() => setTipoFilter('TODOS')}
          />
          {CLIENTE_TIPOS.map((tipo) => (
            <FilterChip
              key={tipo}
              label={CLIENTE_TIPO_LABELS[tipo]}
              active={tipoFilter === tipo}
              onClick={() => setTipoFilter(tipo)}
            />
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Nombre / Razón social</th>
              <th className="px-4 py-2">Identificación</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Ciudad</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                  No hay clientes que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.identificacion}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.tipoCliente === 'CORPORATIVO'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {CLIENTE_TIPO_LABELS[item.tipoCliente]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{item.telefono || '—'}</td>
                  <td className="px-4 py-2">{item.correo || '—'}</td>
                  <td className="px-4 py-2">{item.ciudad || '—'}</td>
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
                    {!readOnly && (
                      <>
                        <button onClick={() => openEdit(item)} className="text-orange-600 hover:underline">
                          Editar
                        </button>
                        <button
                          onClick={() => setActive(item.id, !item.active)}
                          className="text-neutral-500 hover:underline"
                        >
                          {item.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Tipo de cliente">
              <div className="flex overflow-hidden rounded-md border w-fit">
                {CLIENTE_TIPOS.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm({ ...form, tipoCliente: tipo })}
                    className={`px-4 py-2 text-sm ${
                      form.tipoCliente === tipo
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-neutral-600'
                    }`}
                  >
                    {CLIENTE_TIPO_LABELS[tipo]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Nombre o razón social">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Identificación (cédula/NIT)">
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
            <Field label="Dirección">
              <input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Ciudad">
              <input
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                className={inputClass}
              />
            </Field>

            {editing ? (
              <ClienteArchivosSection clienteId={editing.id} />
            ) : (
              <p className="text-xs text-neutral-400">
                Podrás adjuntar archivos (cédula, RUT, contrato…) después de guardar el cliente.
              </p>
            )}

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

      {showImport && (
        <BulkImportModal<ClienteInput>
          title="Cargar clientes desde Excel"
          columns={IMPORT_COLUMNS}
          schema={clienteSchema}
          onCreateOne={create}
          onClose={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
