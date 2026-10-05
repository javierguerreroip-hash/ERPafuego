import { useState } from 'react';
import { inventarioFinalFisicoSchema } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Field, inputClass } from './Field';

export function InventarioFinalFisicoModal({
  articulo,
  fecha,
  onClose,
  onSaved,
}: {
  articulo: {
    articuloId: string;
    articuloNombre: string;
    unit: string;
    inventarioFinalFisicoQuantity: number;
    inventarioFinalFisicoRegistrado: boolean;
  };
  fecha: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [quantity, setQuantity] = useState(
    articulo.inventarioFinalFisicoRegistrado ? String(articulo.inventarioFinalFisicoQuantity) : '',
  );
  const [unitCost, setUnitCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fin de mes → el conteo es también el inicial del mes siguiente.
  const diaSiguiente = new Date(`${fecha}T00:00:00`);
  diaSiguiente.setDate(diaSiguiente.getDate() + 1);
  const fechaInicioMesSiguiente = diaSiguiente.getDate() === 1 ? diaSiguiente : null;

  async function handleSubmit() {
    setError(null);
    const payload = {
      articuloId: articulo.articuloId,
      fecha,
      quantity: Number(quantity),
      unitCost: unitCost ? Number(unitCost) : undefined,
    };
    const parsed = inventarioFinalFisicoSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/inventario/final-fisico', { method: 'POST', body: parsed.data, token });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Inventario final físico — ${articulo.articuloNombre}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">
          Conteo físico de cierre ({new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO')}), independiente del inventario final calculado por el sistema.
        </p>
        {fechaInicioMesSiguiente && (
          <p className="rounded-md bg-orange-50 p-2 text-xs text-orange-800">
            Este conteo también queda como inventario inicial del{' '}
            {fechaInicioMesSiguiente.toLocaleDateString('es-CO')} (mes siguiente), y se actualiza
            cada vez que lo edites.
          </p>
        )}
        <Field label={`Cantidad (${articulo.unit})`}>
          <input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Costo unitario (opcional — por defecto usa el último precio de compra)">
          <input
            type="number"
            min={0}
            step="any"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className={inputClass}
            placeholder="Automático"
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
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
