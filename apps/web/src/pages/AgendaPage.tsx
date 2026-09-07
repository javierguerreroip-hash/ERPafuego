import { useEffect, useState } from 'react';
import {
  ESTADOS_ANTICIPO,
  ESTADO_ANTICIPO_LABELS,
  type AgendaEventoDTO,
  type EstadoAnticipo,
  type EventoDisponibleDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { AgendaEventoFormModal } from '../components/AgendaEventoFormModal';
import { inputClass } from '../components/Field';
import { formatCOP } from '../lib/format';

interface Vendedor {
  id: string;
  name: string;
}

const ESTADO_COLORS: Record<EstadoAnticipo, string> = {
  SIN_ANTICIPO: 'bg-red-100 text-red-700',
  SALDO_PENDIENTE: 'bg-amber-100 text-amber-700',
  ANTICIPO_PAGADO: 'bg-green-100 text-green-700',
};

function buildCalendarDays(start: string, end: string): string[] {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  const startDay = startDate.getDay();
  const gridStart = new Date(startDate);
  gridStart.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));

  const endDay = endDate.getDay();
  const gridEnd = new Date(endDate);
  gridEnd.setDate(endDate.getDate() + (endDay === 0 ? 0 : 7 - endDay));

  const days: string[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export function AgendaPage() {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<'LISTA' | 'CALENDARIO'>('LISTA');
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [vendedorId, setVendedorId] = useState('');
  const [estado, setEstado] = useState('');

  const [registros, setRegistros] = useState<AgendaEventoDTO[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [eventosDisponibles, setEventosDisponibles] = useState<EventoDisponibleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AgendaEventoDTO | null>(null);

  async function loadRegistros() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start, end });
      if (vendedorId) params.set('vendedorId', vendedorId);
      if (estado) params.set('estado', estado);
      const data = await apiFetch<AgendaEventoDTO[]>(`/agenda?${params.toString()}`, { token });
      setRegistros(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }

  async function loadAuxiliares() {
    try {
      const [vendedoresData, eventosData] = await Promise.all([
        apiFetch<Vendedor[]>('/agenda/vendedores', { token }),
        apiFetch<EventoDisponibleDTO[]>('/agenda/eventos-disponibles', { token }),
      ]);
      setVendedores(vendedoresData);
      setEventosDisponibles(eventosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos auxiliares');
    }
  }

  useEffect(() => {
    loadAuxiliares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRegistros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, vendedorId, estado]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(registro: AgendaEventoDTO) {
    setEditing(registro);
    setShowForm(true);
  }

  async function refreshAll() {
    await Promise.all([loadRegistros(), loadAuxiliares()]);
  }

  const registrosPorDia = new Map<string, AgendaEventoDTO[]>();
  for (const r of registros) {
    const dia = r.fecha.slice(0, 10);
    const prev = registrosPorDia.get(dia) ?? [];
    prev.push(r);
    registrosPorDia.set(dia, prev);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Agenda de Eventos</h1>
          <p className="text-sm text-neutral-500">
            Logística de eventos confirmados — el detalle financiero vive en Ventas y Costos.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex overflow-hidden rounded-md border">
            <button
              onClick={() => setViewMode('LISTA')}
              className={`px-3 py-2 text-sm ${viewMode === 'LISTA' ? 'bg-orange-600 text-white' : 'bg-white text-neutral-600'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('CALENDARIO')}
              className={`px-3 py-2 text-sm ${viewMode === 'CALENDARIO' ? 'bg-orange-600 text-white' : 'bg-white text-neutral-600'}`}
            >
              Calendario
            </button>
          </div>
          <button
            onClick={openCreate}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Nuevo registro
          </button>
        </div>
      </div>

      <PeriodPickerControls filter={filter} />

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className={inputClass}>
          <option value="">Todos los vendedores</option>
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
          <option value="">Todos los estados</option>
          {ESTADOS_ANTICIPO.map((e) => (
            <option key={e} value={e}>
              {ESTADO_ANTICIPO_LABELS[e]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : viewMode === 'LISTA' ? (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Menú</th>
                <th className="px-4 py-2">Personas</th>
                <th className="px-4 py-2">Contacto</th>
                <th className="px-4 py-2">Dirección</th>
                <th className="px-4 py-2">Hora</th>
                <th className="px-4 py-2">Vendedor</th>
                <th className="px-4 py-2">Saldo pendiente</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-neutral-400">
                    No hay eventos en la agenda para este filtro.
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openEdit(r)}
                    className="cursor-pointer border-t hover:bg-neutral-50"
                  >
                    <td className="px-4 py-2">{new Date(r.fecha).toLocaleDateString('es-CO')}</td>
                    <td className="px-4 py-2">{r.clienteNombre}</td>
                    <td className="px-4 py-2">{r.opcionMenuNombre}</td>
                    <td className="px-4 py-2">{r.numeroPersonas}</td>
                    <td className="px-4 py-2">
                      {r.personaContacto || '—'} {r.telefonoContacto && `· ${r.telefonoContacto}`}
                    </td>
                    <td className="px-4 py-2">{r.direccion || '—'}</td>
                    <td className="px-4 py-2">{r.horaServicio || '—'}</td>
                    <td className="px-4 py-2">{r.vendedorNombre ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO_COLORS[r.estadoAnticipo]}`}>
                        {formatCOP(r.saldoPendiente)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="grid grid-cols-7 bg-neutral-50 text-center text-xs font-medium text-neutral-500">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="border-b px-2 py-2">
                {d}
              </div>
            ))}
          </div>
          {chunk(buildCalendarDays(start, end), 7).map((week, i) => (
            <div key={i} className="grid grid-cols-7">
              {week.map((day) => {
                const eventosDia = registrosPorDia.get(day) ?? [];
                const enRango = day >= start && day <= end;
                return (
                  <div
                    key={day}
                    className={`min-h-[90px] border-b border-r p-1 text-xs ${enRango ? '' : 'bg-neutral-50 text-neutral-300'}`}
                  >
                    <p className="mb-1 text-right text-neutral-400">{Number(day.slice(8, 10))}</p>
                    <div className="space-y-1">
                      {eventosDia.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => openEdit(ev)}
                          className={`block w-full truncate rounded px-1 py-0.5 text-left ${ESTADO_COLORS[ev.estadoAnticipo]}`}
                          title={`${ev.clienteNombre} — ${ev.opcionMenuNombre}`}
                        >
                          {ev.clienteNombre}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AgendaEventoFormModal
          editing={editing}
          eventosDisponibles={eventosDisponibles}
          vendedores={vendedores}
          onClose={() => setShowForm(false)}
          onSaved={refreshAll}
        />
      )}
    </div>
  );
}
