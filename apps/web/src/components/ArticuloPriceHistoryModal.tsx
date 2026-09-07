import { useEffect, useState } from 'react';
import type { ArticuloDTO, CompraDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../lib/format';
import { Modal } from './Modal';

export function ArticuloPriceHistoryModal({
  articulo,
  onClose,
}: {
  articulo: ArticuloDTO;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [compras, setCompras] = useState<CompraDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CompraDTO[]>(`/compras?articuloId=${articulo.id}`, { token })
      .then(setCompras)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el histórico'))
      .finally(() => setLoading(false));
  }, [articulo.id, token]);

  return (
    <Modal title={`Histórico de precios — ${articulo.name}`} onClose={onClose}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="py-6 text-center text-sm text-neutral-400">Cargando…</p>
      ) : compras.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">
          Todavía no hay compras registradas para este artículo.
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Proveedor</th>
                <th className="px-2 py-2">Cantidad</th>
                <th className="px-2 py-2">Precio unitario</th>
                <th className="px-2 py-2">Factura</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((compra) => (
                <tr key={compra.id} className="border-t">
                  <td className="px-2 py-2">{new Date(compra.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="px-2 py-2">{compra.proveedorNombre}</td>
                  <td className="px-2 py-2">
                    {compra.quantity} {compra.unit}
                  </td>
                  <td className="px-2 py-2">{formatCOP(compra.unitPrice)}</td>
                  <td className="px-2 py-2">{compra.facturaNumero}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
