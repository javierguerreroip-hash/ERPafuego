import { useEffect, useState } from 'react';
import { USER_ROLES, USER_ROLE_LABELS, type UserDTO, type UserRole } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Field, inputClass } from '../components/Field';

interface CreateForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface EditForm {
  name: string;
  role: UserRole;
}

const EMPTY_CREATE: CreateForm = { name: '', email: '', password: '', role: 'OPERACION' };

export function UsuariosPage() {
  const { token, user: currentUser } = useAuth();
  const [items, setItems] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', role: 'OPERACION' });
  const [editError, setEditError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setItems(await apiFetch<UserDTO[]>('/usuarios', { token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setCreateForm(EMPTY_CREATE);
    setCreateError(null);
    setShowCreate(true);
  }

  async function handleCreate() {
    setCreateError(null);
    setSubmitting(true);
    try {
      await apiFetch('/usuarios', { method: 'POST', body: createForm, token });
      setShowCreate(false);
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear el usuario');
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(item: UserDTO) {
    setEditing(item);
    setEditForm({ name: item.name, role: item.role });
    setEditError(null);
  }

  async function handleEdit() {
    if (!editing) return;
    setEditError(null);
    try {
      await apiFetch(`/usuarios/${editing.id}`, { method: 'PUT', body: editForm, token });
      setEditing(null);
      await refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  const filteredItems = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
  });

  async function toggleActive(item: UserDTO) {
    try {
      await apiFetch(`/usuarios/${item.id}/active`, {
        method: 'PATCH',
        body: { active: !item.active },
        token,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el usuario');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Usuarios</h1>
          <p className="text-sm text-neutral-500">
            Crea aquí los vendedores, el equipo de operación y el personal de cocina que necesita
            marcar turno para nómina.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nuevo usuario
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className={`${inputClass} max-w-sm`}
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  {items.length === 0
                    ? 'No hay usuarios registrados.'
                    : 'Ningún usuario coincide con la búsqueda.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.email}</td>
                  <td className="px-4 py-2">{USER_ROLE_LABELS[item.role]}</td>
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
                      onClick={() => toggleActive(item)}
                      disabled={item.id === currentUser?.id}
                      title={item.id === currentUser?.id ? 'No puedes desactivar tu propio usuario' : ''}
                      className="text-neutral-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
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

      {showCreate && (
        <Modal title="Nuevo usuario" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <Field label="Nombre completo">
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Correo">
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Contraseña (mínimo 8 caracteres)">
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Rol">
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                className={inputClass}
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {USER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </Field>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {submitting ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title="Editar usuario" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Nombre completo">
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Rol">
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                className={inputClass}
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {USER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </Field>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
