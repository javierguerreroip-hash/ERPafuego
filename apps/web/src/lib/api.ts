const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => undefined);

  if (!res.ok) {
    if (res.status === 401) {
      // Sesión inválida o expirada en cualquier momento (no solo al
      // cargar la app) — AuthContext escucha este evento para cerrar
      // sesión y mandar al operador de vuelta al login, en vez de
      // dejarlo viendo un mensaje de error suelto en cada pantalla.
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw new Error(data?.message ?? 'Error de comunicación con el servidor');
  }

  return data as T;
}
