import { useEffect, useState } from 'react';
import { CATEGORIAS_MONITOREO, type ArticuloDTO, type EventoDetailDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCOP } from '../lib/format';
import { Modal } from './Modal';
import { inputClass } from './Field';

export function EventoDetailModal({
  eventoId,
  onClose,
  onChanged,
}: {
  eventoId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { token, user } = useAuth();
  const readOnly = user?.role === 'CONSULTA';
  const [evento, setEvento] = useState<EventoDetailDTO | null>(null);
  const [articulos, setArticulos] = useState<ArticuloDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newArticuloId, setNewArticuloId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [eventoData, articulosData] = await Promise.all([
        apiFetch<EventoDetailDTO>(`/eventos/${eventoId}`, { token }),
        apiFetch<ArticuloDTO[]>('/articulos', { token }),
      ]);
      setEvento(eventoData);
      setArticulos(articulosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // Las categorías de monitoreo (Insumos de Aseo, Utensilios) no son
  // consumo por evento (el backend las rechaza) — se excluyen del
  // selector para que no aparezcan como opción confusa.
  const activeArticulos = articulos.filter(
    (a) => a.active && !CATEGORIAS_MONITOREO.includes(a.category),
  );

  async function handleAddConsumo() {
    setAddError(null);
    const quantity = Number(newQuantity);
    if (!newArticuloId) {
      setAddError('Selecciona un artículo');
      return;
    }
    if (!(quantity > 0)) {
      setAddError('La cantidad debe ser mayor a 0');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/eventos/${eventoId}/consumos`, {
        method: 'POST',
        body: { articuloId: newArticuloId, quantity },
        token,
      });
      setNewArticuloId('');
      setNewQuantity('');
      await load();
      onChanged();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Error al agregar el consumo');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveConsumo(consumoId: string) {
    try {
      await apiFetch(`/eventos/${eventoId}/consumos/${consumoId}`, { method: 'DELETE', token });
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al quitar el consumo');
    }
  }

  async function handleUpdateQuantity(consumoId: string, quantity: number, previous: number) {
    if (!(quantity > 0) || quantity === previous) return;
    try {
      await apiFetch(`/eventos/${eventoId}/consumos/${consumoId}`, {
        method: 'PUT',
        body: { quantity },
        token,
      });
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la cantidad');
    }
  }

  return (
    <Modal title={evento ? `Detalle del evento — ${evento.clienteNombre}` : 'Detalle del evento'} onClose={onClose}>
      {loading ? (
        <p className="py-6 text-center text-sm text-neutral-400">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : evento ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 rounded-md bg-neutral-50 p-3 text-sm">
            <div>
              <p className="text-neutral-500">Opción de menú</p>
              <p className="font-medium">{evento.opcionMenuNombre}</p>
            </div>
            <div>
              <p className="text-neutral-500">Personas</p>
              <p className="font-medium">{evento.numeroPersonas}</p>
            </div>
            <div>
              <p className="text-neutral-500">Valor antes de impuestos</p>
              <p className="font-medium">{formatCOP(evento.valorAntesImpuestos)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Valor después de impuestos</p>
              <p className="font-medium">
                {formatCOP(evento.valorDespuesImpuestos)}
                {evento.taxRateNombre && (
                  <span className="ml-1 text-xs text-neutral-400">({evento.taxRateNombre})</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Costo total</p>
              <p className="font-medium">
                {formatCOP(evento.costoTotal)}{' '}
                <span className="text-xs text-neutral-400">
                  ({evento.costoTotalPorcentaje.toFixed(1)}%)
                </span>
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Utilidad operacional</p>
              <p className={`font-medium ${evento.utilidadOperacional < 0 ? 'text-red-600' : ''}`}>
                {formatCOP(evento.utilidadOperacional)}{' '}
                <span className="text-xs text-neutral-400">
                  ({evento.utilidadOperacionalPorcentaje.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">
              Consumos (materia prima y servicios)
            </p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Artículo</th>
                    <th className="px-3 py-2">Cantidad</th>
                    <th className="px-3 py-2">Costo unitario</th>
                    <th className="px-3 py-2">Subtotal</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {evento.consumos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-neutral-400">
                        Todavía no hay consumos cargados.
                      </td>
                    </tr>
                  ) : (
                    evento.consumos.map((consumo) => (
                      <tr key={consumo.id} className="border-t">
                        <td className="px-3 py-2">
                          {consumo.articuloNombre}{' '}
                          <span className="text-xs text-neutral-400">({consumo.articuloCodigo})</span>
                        </td>
                        <td className="px-3 py-2">
                          {readOnly ? (
                            `${consumo.quantity} ${consumo.unit}`
                          ) : (
                            <>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                defaultValue={consumo.quantity}
                                key={`${consumo.id}-${consumo.quantity}`}
                                onBlur={(e) =>
                                  handleUpdateQuantity(consumo.id, Number(e.target.value), consumo.quantity)
                                }
                                className="w-20 rounded border border-neutral-200 px-1 py-0.5 text-sm"
                              />{' '}
                              {consumo.unit}
                            </>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {consumo.unitCost > 0 ? (
                            formatCOP(consumo.unitCost)
                          ) : (
                            <span className="text-amber-600">$0 (sin compras aún)</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{formatCOP(consumo.subtotal)}</td>
                        <td className="px-3 py-2 text-right">
                          {!readOnly && (
                            <button
                              onClick={() => handleRemoveConsumo(consumo.id)}
                              className="text-neutral-400 hover:text-red-600"
                            >
                              Quitar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!readOnly && (
              <>
                <div className="mt-2 grid grid-cols-12 gap-2">
                  <select
                    value={newArticuloId}
                    onChange={(e) => setNewArticuloId(e.target.value)}
                    className={`${inputClass} col-span-6`}
                  >
                    <option value="">Artículo…</option>
                    {activeArticulos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="Cantidad"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className={`${inputClass} col-span-3`}
                  />
                  <button
                    onClick={handleAddConsumo}
                    disabled={submitting}
                    className="col-span-3 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
                {addError && <p className="mt-1 text-sm text-red-600">{addError}</p>}
              </>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
