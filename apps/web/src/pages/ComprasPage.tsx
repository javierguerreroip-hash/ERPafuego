import { useEffect, useState } from 'react';
import {
  CONDICIONES_PAGO,
  CONDICION_PAGO_LABELS,
  compraBatchSchema,
  type ArticuloDTO,
  type CompraBatchInput,
  type CompraDTO,
  type CondicionPago,
  type ProveedorDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Field, inputClass } from '../components/Field';
import { formatCOP, formatDateOnly } from '../lib/format';

interface ItemRow {
  articuloId: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_ITEM: ItemRow = { articuloId: '', quantity: '', unitPrice: '' };

function emptyHeader() {
  return {
    proveedorId: '',
    fecha: new Date().toISOString().slice(0, 10),
    facturaNumero: '',
    condicionPago: 'CONTADO' as CondicionPago,
    fechaVencimiento: '',
  };
}

export function ComprasPage() {
  const { token, user } = useAuth();
  const [compras, setCompras] = useState<CompraDTO[]>([]);
  const [articulos, setArticulos] = useState<ArticuloDTO[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [header, setHeader] = useState(emptyHeader());
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deletingCompra, setDeletingCompra] = useState<CompraDTO | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [comprasData, articulosData, proveedoresData] = await Promise.all([
        apiFetch<CompraDTO[]>('/compras', { token }),
        apiFetch<ArticuloDTO[]>('/articulos', { token }),
        apiFetch<ProveedorDTO[]>('/proveedores', { token }),
      ]);
      setCompras(comprasData);
      setArticulos(articulosData);
      setProveedores(proveedoresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeArticulos = articulos.filter((a) => a.active);
  const activeProveedores = proveedores.filter((p) => p.active);

  function openCreate() {
    setHeader(emptyHeader());
    setItems([{ ...EMPTY_ITEM }]);
    setFormError(null);
    setShowForm(true);
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const grandTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  async function handleSubmit() {
    setFormError(null);

    const payload: CompraBatchInput = {
      proveedorId: header.proveedorId,
      fecha: header.fecha,
      facturaNumero: header.facturaNumero,
      condicionPago: header.condicionPago,
      fechaVencimiento: header.condicionPago === 'CREDITO' ? header.fechaVencimiento || null : null,
      items: items.map((item) => ({
        articuloId: item.articuloId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    const parsed = compraBatchSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch<CompraDTO[]>('/compras', {
        method: 'POST',
        body: parsed.data,
        token,
      });
      setCompras((prev) => [...created, ...prev]);
      // El "último precio de compra" de los artículos afectados cambió — refresca el catálogo.
      const articulosData = await apiFetch<ArticuloDTO[]>('/articulos', { token });
      setArticulos(articulosData);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar la compra');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Registro de Compras</h1>
          <p className="text-sm text-neutral-500">
            Cada factura puede tener varios ítems; el último precio de compra del artículo se
            actualiza automáticamente.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Nueva compra
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Artículo</th>
              <th className="px-4 py-2">Proveedor</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Precio unitario</th>
              <th className="px-4 py-2">Valor total</th>
              <th className="px-4 py-2">Factura</th>
              <th className="px-4 py-2">Condición</th>
              <th className="px-4 py-2">Vencimiento</th>
              {user?.role === 'ADMINISTRADOR' && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-neutral-400">
                  Cargando…
                </td>
              </tr>
            ) : compras.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-neutral-400">
                  Todavía no hay compras registradas.
                </td>
              </tr>
            ) : (
              compras.map((compra) => (
                <tr key={compra.id} className="border-t">
                  <td className="px-4 py-2">{formatDateOnly(compra.fecha)}</td>
                  <td className="px-4 py-2">
                    {compra.articuloNombre}{' '}
                    <span className="text-xs text-neutral-400">({compra.articuloCodigo})</span>
                  </td>
                  <td className="px-4 py-2">{compra.proveedorNombre}</td>
                  <td className="px-4 py-2">
                    {compra.quantity} {compra.unit}
                  </td>
                  <td className="px-4 py-2">{formatCOP(compra.unitPrice)}</td>
                  <td className="px-4 py-2">{formatCOP(compra.totalValue)}</td>
                  <td className="px-4 py-2">{compra.facturaNumero}</td>
                  <td className="px-4 py-2">{CONDICION_PAGO_LABELS[compra.condicionPago]}</td>
                  <td className="px-4 py-2">
                    {compra.fechaVencimiento ? formatDateOnly(compra.fechaVencimiento) : '—'}
                  </td>
                  {user?.role === 'ADMINISTRADOR' && (
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => setDeletingCompra(compra)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nueva compra" onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Proveedor">
                <select
                  value={header.proveedorId}
                  onChange={(e) => setHeader({ ...header, proveedorId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Selecciona…</option>
                  {activeProveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha">
                <input
                  type="date"
                  value={header.fecha}
                  onChange={(e) => setHeader({ ...header, fecha: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Número de factura">
                <input
                  value={header.facturaNumero}
                  onChange={(e) => setHeader({ ...header, facturaNumero: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Condición de pago">
                <select
                  value={header.condicionPago}
                  onChange={(e) =>
                    setHeader({ ...header, condicionPago: e.target.value as CondicionPago })
                  }
                  className={inputClass}
                >
                  {CONDICIONES_PAGO.map((c) => (
                    <option key={c} value={c}>
                      {CONDICION_PAGO_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>
              {header.condicionPago === 'CREDITO' && (
                <Field label="Fecha de vencimiento">
                  <input
                    type="date"
                    value={header.fechaVencimiento}
                    onChange={(e) => setHeader({ ...header, fechaVencimiento: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Ítems de la compra</span>
                <button onClick={addItem} className="text-sm text-orange-600 hover:underline">
                  + Agregar ítem
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => {
                  const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  return (
                    <div key={index} className="rounded-md border border-neutral-200 p-3">
                      <div className="grid grid-cols-12 gap-2">
                        <select
                          value={item.articuloId}
                          onChange={(e) => updateItem(index, { articuloId: e.target.value })}
                          className={`${inputClass} col-span-5`}
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
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                          className={`${inputClass} col-span-3`}
                        />
                        <input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Precio unitario"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                          className={`${inputClass} col-span-3`}
                        />
                        <button
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="col-span-1 text-neutral-400 hover:text-red-600 disabled:opacity-30"
                          aria-label="Quitar ítem"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="mt-1 text-right text-xs text-neutral-500">
                        Subtotal: {formatCOP(subtotal)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-right text-sm font-medium text-neutral-900">
                Total: {formatCOP(grandTotal)}
              </p>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-neutral-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Guardar compra'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deletingCompra && (
        <ConfirmDeleteModal
          title="Eliminar compra"
          message={`Vas a eliminar definitivamente la compra de "${deletingCompra.articuloNombre}" a ${deletingCompra.proveedorNombre} (factura ${deletingCompra.facturaNumero}, ${formatDateOnly(deletingCompra.fecha)}). El último precio de compra del artículo se recalcula automáticamente.`}
          onConfirm={async (password) => {
            await apiFetch(`/compras/${deletingCompra.id}`, {
              method: 'DELETE',
              body: { password },
              token,
            });
            setDeletingCompra(null);
            await loadAll();
          }}
          onClose={() => setDeletingCompra(null)}
        />
      )}
    </div>
  );
}
