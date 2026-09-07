import { useState } from 'react';
import { abonoSchema, type AbonoInput } from '@erp-afuego/shared';
import { Modal } from './Modal';
import { Field, inputClass } from './Field';
import { formatCOP } from '../lib/format';

export function AbonoModal({
  title,
  saldoPendiente,
  onClose,
  onSubmit,
}: {
  title: string;
  saldoPendiente: number;
  onClose: () => void;
  onSubmit: (input: AbonoInput) => Promise<void>;
}) {
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    const parsed = abonoSchema.safeParse({ valor: Number(valor), fecha });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el abono');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">Saldo pendiente actual: {formatCOP(saldoPendiente)}</p>
        <Field label="Valor del abono (COP)">
          <input
            type="number"
            min={0}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Fecha del abono">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-neutral-600">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting ? 'Guardando…' : 'Registrar abono'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
