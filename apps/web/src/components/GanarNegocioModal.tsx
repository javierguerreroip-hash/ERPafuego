import { useState } from 'react';
import {
  ganarNegocioSchema,
  type CotizacionDTO,
  type GanarNegocioInput,
  type NegocioDTO,
  type OpcionMenuDTO,
  type TaxRateDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Field, inputClass } from './Field';
import { formatCOP, formatDateOnly } from '../lib/format';

export function GanarNegocioModal({
  negocio,
  cotizacion,
  opcionesMenu,
  taxRates,
  onClose,
  onGanado,
}: {
  negocio: NegocioDTO;
  // Cotización de la que nació el negocio (null en negocios históricos).
  cotizacion: CotizacionDTO | null;
  opcionesMenu: OpcionMenuDTO[];
  taxRates: TaxRateDTO[];
  onClose: () => void;
  onGanado: () => void;
}) {
  const { token } = useAuth();
  // Propuesta 001 · entrega 2: si la cotización trae al menos una opción de
  // menú reconocible, se gana SIN preguntar nada (todo sale de la cotización).
  // El formulario manual queda solo de respaldo (negocios históricos).
  const normalizar = (t: string) => t.trim().toLowerCase();
  const puedeDirecto =
    cotizacion !== null &&
    cotizacion.items.some(
      (i) => i.opcionMenuId || opcionesMenu.some((o) => normalizar(o.name) === normalizar(i.descripcion)),
    );
  const [manual, setManual] = useState(!puedeDirecto);
  const [opcionMenuId, setOpcionMenuId] = useState('');
  const [numeroPersonas, setNumeroPersonas] = useState('');
  const [taxRateId, setTaxRateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDirecto() {
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch(`/negocios/${negocio.id}/ganar`, { method: 'PATCH', body: {}, token });
      onGanado();
      onClose();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al ganar el negocio';
      setError(mensaje);
      // Si el servidor no reconoció la opción de menú, se piden los datos a mano.
      if (mensaje.includes('opción de menú reconocible')) setManual(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!opcionMenuId) {
      setError('Selecciona una opción de menú');
      return;
    }
    const payload = {
      opcionMenuId,
      numeroPersonas: Number(numeroPersonas),
      taxRateId,
    };
    const parsed = ganarNegocioSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      const body: GanarNegocioInput = parsed.data;
      await apiFetch(`/negocios/${negocio.id}/ganar`, { method: 'PATCH', body, token });
      onGanado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ganar el negocio');
    } finally {
      setSubmitting(false);
    }
  }

  if (!manual && cotizacion) {
    const lineas = cotizacion.items.filter(
      (i) => i.opcionMenuId || opcionesMenu.some((o) => normalizar(o.name) === normalizar(i.descripcion)),
    );
    return (
      <Modal title={`Ganar negocio — ${negocio.clienteNombre}`} onClose={onClose}>
        <div className="space-y-3 text-sm">
          <p className="text-neutral-500">
            Todo sale de la cotización: no hay que escribir nada. Se creará la venta y el registro
            en la Agenda.
          </p>
          <div className="space-y-1 rounded-md bg-neutral-50 p-3 text-xs">
            <p><span className="text-neutral-400">Fecha del evento (fecha de la venta): </span>{formatDateOnly(negocio.fechaEvento)}</p>
            <p><span className="text-neutral-400">Valor antes de impuestos: </span>{formatCOP(negocio.valorAntesImpuestos)}</p>
            <p><span className="text-neutral-400">Impuesto: </span>{cotizacion.taxRateNombre ?? 'Sin impuesto'}</p>
            <p><span className="text-neutral-400">Invitados: </span>{cotizacion.numeroPersonas}</p>
            <p><span className="text-neutral-400">Vendedor: </span>{negocio.vendedorNombre}</p>
            <div>
              <span className="text-neutral-400">Opciones de menú:</span>
              <ul className="ml-4 list-disc">
                {lineas.map((l, i) => (
                  <li key={i}>
                    {l.descripcion} — {l.cantidad}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            En la Agenda quedarán el contacto y el teléfono del cliente; solo faltará completar la
            hora y la dirección.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setManual(true)}
              className="text-xs text-neutral-500 underline hover:text-orange-600"
            >
              Elegir los datos a mano
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-neutral-600">
                Cancelar
              </button>
              <button
                onClick={handleDirecto}
                disabled={submitting}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Confirmar ganado'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Ganar negocio — ${negocio.clienteNombre}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">
          Este negocio no tiene una cotización con opción de menú reconocible: elígela aquí para
          crear el evento en Ventas y Costos ({formatCOP(negocio.valorAntesImpuestos)} antes de impuestos, ya
          diligenciado).
        </p>
        <Field label="Opción de menú vendida">
          <select
            value={opcionMenuId}
            onChange={(e) => setOpcionMenuId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecciona…</option>
            {opcionesMenu.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({formatCOP(o.price)})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Número de personas">
          <input
            type="number"
            min={1}
            value={numeroPersonas}
            onChange={(e) => setNumeroPersonas(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Tasa de impuesto">
          <select
            value={taxRateId ?? ''}
            onChange={(e) => setTaxRateId(e.target.value || null)}
            className={inputClass}
          >
            <option value="">Sin impuesto</option>
            {taxRates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-neutral-600">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? 'Guardando…' : 'Confirmar ganado'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
