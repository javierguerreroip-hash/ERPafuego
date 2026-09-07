import { useState } from 'react';
import {
  agendaEventoSchema,
  agendaEventoUpdateSchema,
  type AgendaEventoDTO,
  type AgendaEventoInput,
  type EventoDisponibleDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Field, inputClass } from './Field';
import { formatCOP } from '../lib/format';

interface Vendedor {
  id: string;
  name: string;
}

export function AgendaEventoFormModal({
  editing,
  eventosDisponibles,
  vendedores,
  onClose,
  onSaved,
}: {
  editing: AgendaEventoDTO | null;
  eventosDisponibles: EventoDisponibleDTO[];
  vendedores: Vendedor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [eventoId, setEventoId] = useState('');
  const [form, setForm] = useState({
    personaContacto: editing?.personaContacto ?? '',
    telefonoContacto: editing?.telefonoContacto ?? '',
    direccion: editing?.direccion ?? '',
    horaServicio: editing?.horaServicio ?? '',
    anticipo: editing?.anticipo ?? 0,
    observaciones: editing?.observaciones ?? '',
    vendedorId: editing?.vendedorId ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eventoSeleccionado = eventosDisponibles.find((e) => e.id === eventoId);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (editing) {
        const parsed = agendaEventoUpdateSchema.safeParse(form);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
          return;
        }
        await apiFetch(`/agenda/${editing.id}`, { method: 'PUT', body: parsed.data, token });
      } else {
        const payload: AgendaEventoInput = { eventoId, ...form };
        const parsed = agendaEventoSchema.safeParse(payload);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
          return;
        }
        await apiFetch('/agenda', { method: 'POST', body: parsed.data, token });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={editing ? `Editar agenda — ${editing.clienteNombre}` : 'Nuevo registro de agenda'}
      onClose={onClose}
    >
      <div className="space-y-3">
        {!editing && (
          <Field label="Evento (Módulo 3)">
            <select
              value={eventoId}
              onChange={(e) => setEventoId(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona…</option>
              {eventosDisponibles.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.clienteNombre} — {new Date(e.fecha).toLocaleDateString('es-CO')} —{' '}
                  {e.opcionMenuNombre}
                </option>
              ))}
            </select>
            {eventoSeleccionado && (
              <p className="mt-1 text-xs text-neutral-500">
                {eventoSeleccionado.numeroPersonas} personas ·{' '}
                {formatCOP(eventoSeleccionado.valorAntesImpuestos)}
              </p>
            )}
          </Field>
        )}

        {editing && (
          <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
            {editing.opcionMenuNombre} · {editing.numeroPersonas} personas ·{' '}
            {formatCOP(editing.valorAntesImpuestos)} ·{' '}
            {new Date(editing.fecha).toLocaleDateString('es-CO')}
            <br />
            Estos datos vienen del Módulo 3 y no se editan aquí.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Persona de contacto">
            <input
              value={form.personaContacto}
              onChange={(e) => setForm({ ...form, personaContacto: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Teléfono de contacto">
            <input
              value={form.telefonoContacto}
              onChange={(e) => setForm({ ...form, telefonoContacto: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Dirección del evento">
          <input
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora de servicio">
            <input
              type="time"
              value={form.horaServicio}
              onChange={(e) => setForm({ ...form, horaServicio: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Anticipo recibido (COP)">
            <input
              type="number"
              min={0}
              value={form.anticipo}
              onChange={(e) => setForm({ ...form, anticipo: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Vendedor">
          <select
            value={form.vendedorId ?? ''}
            onChange={(e) => setForm({ ...form, vendedorId: e.target.value || null })}
            className={inputClass}
          >
            <option value="">Sin asignar</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Observaciones adicionales">
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            className={inputClass}
            rows={3}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-neutral-600">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!editing && !eventoId)}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
