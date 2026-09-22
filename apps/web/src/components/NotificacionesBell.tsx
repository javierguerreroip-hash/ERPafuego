import { useEffect, useRef, useState } from 'react';
import type { NotificacionDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 30000;

function tiempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

export function NotificacionesBell() {
  const { token } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificacionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadResumen() {
    try {
      const data = await apiFetch<{ noLeidas: number }>('/notificaciones/resumen', { token });
      setNoLeidas(data.noLeidas);
    } catch {
      // Silencioso — no vale la pena mostrar un error solo por el contador.
    }
  }

  useEffect(() => {
    loadResumen();
    const interval = setInterval(loadResumen, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleToggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (!willOpen) return;

    setLoading(true);
    try {
      const data = await apiFetch<NotificacionDTO[]>('/notificaciones', { token });
      setItems(data);
      if (noLeidas > 0) {
        await apiFetch('/notificaciones/marcar-leidas', { method: 'POST', token });
        setNoLeidas(0);
      }
    } catch {
      // Silencioso.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        Notificaciones
        {noLeidas > 0 && (
          <span className="ml-auto rounded-full bg-orange-600 px-1.5 py-0.5 text-xs font-medium leading-none text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-md border border-neutral-200 bg-white shadow-lg">
          <div className="border-b px-4 py-2 text-sm font-medium text-neutral-700">Notificaciones</div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">
                No hay notificaciones todavía.
              </p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="border-b px-4 py-3 last:border-b-0 hover:bg-neutral-50">
                  <p className="text-sm text-neutral-800">{n.mensaje}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {tiempoRelativo(n.createdAt)}
                    {n.createdByName ? ` · ${n.createdByName}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
