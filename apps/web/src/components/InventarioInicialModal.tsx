import { useState } from 'react';
import { inventarioInicialSchema, type InventarioDetalleDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Field, inputClass } from './Field';

export function InventarioInicialModal({
  articulo,
  fecha,
  onClose,
  onSaved,
}: {
  articulo: InventarioDetalleDTO;
  fecha: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [quantity, setQuantity] = useState(
    articulo.inventarioInicialRegistrado ? String(articulo.inventarioInicialQuantity) : '',
  );
  const [unitCost, setUnitCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    const payload = {
      articuloId: articulo.articuloId,
      fecha,
      quantity: Number(quantity),
      unitCost: unitCost ? Number(unitCost) : undefined,
    };
    const parsed = inventarioInicialSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/inventario/inicial', { method: 'POST', body: parsed.data, token });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Inventario inicial — ${articulo.articuloNombre}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-500">
          Conteo físico al inicio del período ({new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO')}).
        </p>
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
