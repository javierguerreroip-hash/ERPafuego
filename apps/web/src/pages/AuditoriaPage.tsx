import { Fragment, useEffect, useState } from 'react';
import {
  AUDIT_ACCION_LABELS,
  AUDIT_MODELOS,
  AUDIT_MODELO_LABELS,
  type AuditAccion,
  type AuditLogDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FilterChip, inputClass } from '../components/Field';

const ACCION_COLORS: Record<AuditAccion, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  ACTIVATE: 'bg-blue-100 text-blue-700',
  DEACTIVATE: 'bg-neutral-200 text-neutral-600',
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function AuditoriaPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modeloFilter, setModeloFilter] = useState<string>('TODOS');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (modeloFilter !== 'TODOS') params.set('modelo', modeloFilter);
      const data = await apiFetch<AuditLogDTO[]>(`/auditoria?${params.toString()}`, { token });
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la auditoría');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeloFilter]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? logs.filter(
        (l) =>
          l.registroNombre.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q),
      )
    : logs;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-neutral-900">Auditoría — Historial de cambios</h1>
        <p className="text-sm text-neutral-500">
          Quién creó, editó, activó/desactivó o eliminó registros en catálogos y parámetros de
          configuración. Visible solo para Administrador.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por registro o usuario…"
          className={`${inputClass} max-w-sm`}
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Todos"
            active={modeloFilter === 'TODOS'}
            onClick={() => setModeloFilter('TODOS')}
          />
          {AUDIT_MODELOS.map((m) => (
            <FilterChip
              key={m}
              label={AUDIT_MODELO_LABELS[m]}
              active={modeloFilter === m}
              onClick={() => setModeloFilter(m)}
            />
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Módulo</th>
              <th className="px-4 py-2">Registro</th>
              <th className="px-4 py-2">Usuario</th>
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
                  Sin movimientos registrados todavía para este filtro.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="cursor-pointer border-t hover:bg-neutral-50"
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-neutral-500">
                      {formatFecha(log.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${ACCION_COLORS[log.accion]}`}>
                        {AUDIT_ACCION_LABELS[log.accion]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {AUDIT_MODELO_LABELS[log.modelo as keyof typeof AUDIT_MODELO_LABELS] ?? log.modelo}
                    </td>
                    <td className="px-4 py-2">{log.registroNombre}</td>
                    <td className="px-4 py-2">{log.userName}</td>
                    <td className="px-4 py-2 text-right text-xs text-neutral-400">
                      {log.detalle ? (expandedId === log.id ? 'Ocultar' : 'Ver detalle') : ''}
                    </td>
                  </tr>
                  {expandedId === log.id && log.detalle != null && (
                    <tr className="border-t bg-neutral-50">
                      <td colSpan={6} className="px-4 py-3">
                        <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-neutral-600">
                          {JSON.stringify(log.detalle, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
