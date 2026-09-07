import { useState } from 'react';
import {
  ganarNegocioSchema,
  type GanarNegocioInput,
  type NegocioDTO,
  type OpcionMenuDTO,
  type TaxRateDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Field, inputClass } from './Field';
import { formatCOP } from '../lib/format';

export function GanarNegocioModal({
  negocio,
  opcionesMenu,
  taxRates,
  onClose,
  onGanado,
}: {
  negocio: NegocioDTO;
  opcionesMenu: OpcionMenuDTO[];
  taxRates: TaxRateDTO[];
  onClose: () => void;
  onGanado: () => void;
}) {
  const { token } = useAuth();
  const [opcionMenuId, setOpcionMenuId] = useState('');
  const [numeroPersonas, setNumeroPersonas] = useState('');
  const [taxRateId, setTaxRateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
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

  return (
    <Modal title={`Ganar negocio — ${negocio.clienteNombre}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">
          Estos 2 datos no se capturan en el CRM pero son obligatorios para crear el evento en
          Ventas y Costos ({formatCOP(negocio.valorAntesImpuestos)} antes de impuestos, ya
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
