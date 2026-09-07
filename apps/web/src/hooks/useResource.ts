import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Hook genérico de CRUD para los catálogos del Módulo 1 (artículos, opciones
// de menú, clientes, proveedores), que comparten la misma forma de API:
// listar, crear, editar y activar/desactivar (nunca eliminar).
export function useResource<TItem extends { id: string }, TInput>(path: string) {
  const { token } = useAuth();
  const [items, setItems] = useState<TItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<TItem[]>(path, { token });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function create(input: TInput) {
    const created = await apiFetch<TItem>(path, { method: 'POST', body: input, token });
    setItems((prev) => [...prev, created]);
    return created;
  }

  async function update(id: string, input: TInput) {
    const updated = await apiFetch<TItem>(`${path}/${id}`, { method: 'PUT', body: input, token });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  async function setActive(id: string, active: boolean) {
    const updated = await apiFetch<TItem>(`${path}/${id}/active`, {
      method: 'PATCH',
      body: { active },
      token,
    });
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  return { items, loading, error, refresh, create, update, setActive };
}
