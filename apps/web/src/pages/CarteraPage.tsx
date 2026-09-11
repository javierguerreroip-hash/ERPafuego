import { Fragment, useEffect, useState } from 'react';
import {
  ESTADOS_CARTERA,
  ESTADO_CARTERA_LABELS,
  type AbonoInput,
  type CarteraTotalesDTO,
  type ClienteDTO,
  type CuentaPorCobrarDTO,
  type CuentaPorPagarDTO,
  type ProveedorDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodPickerControls } from '../components/PeriodPickerControls';
import { AbonoModal } from '../components/AbonoModal';
import { KpiCard } from '../components/KpiCard';
import { ExportButtons } from '../components/ExportButtons';
import { inputClass } from '../components/Field';
import { formatCOP, formatDateOnly } from '../lib/format';

const CXC_COLUMNS = [
  { key: 'fecha', label: 'Fecha evento' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'valorFacturado', label: 'Valor facturado' },
  { key: 'anticipo', label: 'Anticipo' },
  { key: 'saldo', label: 'Saldo pendiente' },
  { key: 'vencimiento', label: 'Vencimiento' },
  { key: 'estado', label: 'Estado' },
];

const CXP_COLUMNS = [
  { key: 'fecha', label: 'Fecha compra' },
  { key: 'proveedor', label: 'Proveedor' },
  { key: 'factura', label: 'Factura' },
  { key: 'valorFactura', label: 'Valor factura' },
  { key: 'saldo', label: 'Saldo pendiente' },
  { key: 'vencimiento', label: 'Vencimiento' },
  { key: 'estado', label: 'Estado' },
];

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  PAGADA: 'bg-green-100 text-green-700',
  VENCIDA: 'bg-red-100 text-red-700',
};

export function CarteraPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'CXC' | 'CXP'>('CXC');
  const filter = usePeriodFilter('MES');
  const { start, end } = filter;

  const [clienteId, setClienteId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [estado, setEstado] = useState('');

  const [totales, setTotales] = useState<CarteraTotalesDTO | null>(null);
  const [cxc, setCxc] = useState<CuentaPorCobrarDTO[]>([]);
  const [cxp, setCxp] = useState<CuentaPorPagarDTO[]>([]);
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [abonoFor, setAbonoFor] = useState<
    | { tipo: 'CXC'; eventoId: string; saldo: number }
    | { tipo: 'CXP'; cuentaId: string; saldo: number }
    | null
  >(null);

  async function loadTotales() {
    try {
      const data = await apiFetch<CarteraTotalesDTO>('/cartera/totales', { token });
      setTotales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los totales');
    }
  }

  async function loadAuxiliares() {
    try {
      const [clientesData, proveedoresData] = await Promise.all([
        apiFetch<ClienteDTO[]>('/clientes', { token }),
        apiFetch<ProveedorDTO[]>('/proveedores', { token }),
      ]);
      setClientes(clientesData);
      setProveedores(proveedoresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes/proveedores');
    }
  }

  async function loadTab() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start, end });
      if (estado) params.set('estado', estado);
      if (tab === 'CXC') {
        if (clienteId) params.set('clienteId', clienteId);
        setCxc(await apiFetch<CuentaPorCobrarDTO[]>(`/cartera/cxc?${params.toString()}`, { token }));
      } else {
        if (proveedorId) params.set('proveedorId', proveedorId);
        setCxp(await apiFetch<CuentaPorPagarDTO[]>(`/cartera/cxp?${params.toString()}`, { token }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la cartera');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTotales();
    loadAuxiliares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, start, end, clienteId, proveedorId, estado]);

  async function handleAbono(input: AbonoInput) {
    if (!abonoFor) return;
    if (abonoFor.tipo === 'CXC') {
      await apiFetch(`/cartera/cxc/${abonoFor.eventoId}/abonos`, { method: 'POST', body: input, token });
    } else {
      await apiFetch(`/cartera/cxp/${abonoFor.cuentaId}/abonos`, { method: 'POST', body: input, token });
    }
    await Promise.all([loadTab(), loadTotales()]);
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Cartera</h1>
          <p className="text-sm text-neutral-500">
            Cuentas por cobrar y por pagar — solo lectura salvo abonos.
          </p>
        </div>
        {tab === 'CXC' ? (
          <ExportButtons
            filename={`cxc_${start}_${end}`}
            title="Cuentas por Cobrar"
            subtitle={`Período: ${start} a ${end}`}
            columns={CXC_COLUMNS}
            rows={cxc.map((r) => ({
              fecha: formatDateOnly(r.fechaEvento),
              cliente: r.clienteNombre,
              valorFacturado: formatCOP(r.valorTotalFacturado),
              anticipo: formatCOP(r.anticipo),
              saldo: formatCOP(r.saldoPendiente),
              vencimiento: formatDateOnly(r.fechaVencimiento),
              estado: ESTADO_CARTERA_LABELS[r.estado],
            }))}
          />
        ) : (
          <ExportButtons
            filename={`cxp_${start}_${end}`}
            title="Cuentas por Pagar"
            subtitle={`Período: ${start} a ${end}`}
            columns={CXP_COLUMNS}
            rows={cxp.map((r) => ({
              fecha: formatDateOnly(r.fechaCompra),
              proveedor: r.proveedorNombre,
              factura: r.facturaNumero,
              valorFactura: formatCOP(r.valorFactura),
              saldo: formatCOP(r.saldoPendiente),
              vencimiento: r.fechaVencimiento ? formatDateOnly(r.fechaVencimiento) : '—',
              estado: ESTADO_CARTERA_LABELS[r.estado],
            }))}
          />
        )}
      </div>

      {totales && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total por cobrar" value={totales.totalPorCobrar} highlight />
          <KpiCard label="Por cobrar vencido" value={totales.totalPorCobrarVencido} negative />
          <KpiCard label="Total por pagar" value={totales.totalPorPagar} />
          <KpiCard label="Por pagar vencido" value={totales.totalPorPagarVencido} negative />
        </div>
      )}

      <div className="mb-4 flex overflow-hidden rounded-md border w-fit">
        <button
          onClick={() => setTab('CXC')}
          className={`px-4 py-2 text-sm ${tab === 'CXC' ? 'bg-orange-600 text-white' : 'bg-white text-neutral-600'}`}
        >
          Cuentas por Cobrar
        </button>
        <button
          onClick={() => setTab('CXP')}
          className={`px-4 py-2 text-sm ${tab === 'CXP' ? 'bg-orange-600 text-white' : 'bg-white text-neutral-600'}`}
        >
          Cuentas por Pagar
        </button>
      </div>

      <PeriodPickerControls filter={filter} />

      <div className="mb-4 flex flex-wrap gap-3">
        {tab === 'CXC' ? (
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputClass}>
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
          <option value="">Todos los estados</option>
          {ESTADOS_CARTERA.map((e) => (
            <option key={e} value={e}>
              {ESTADO_CARTERA_LABELS[e]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : tab === 'CXC' ? (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-2">Fecha evento</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Valor facturado</th>
                <th className="px-4 py-2">Anticipo</th>
                <th className="px-4 py-2">Saldo pendiente</th>
                <th className="px-4 py-2">Vencimiento</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {cxc.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                    No hay cuentas por cobrar para este filtro.
                  </td>
                </tr>
              ) : (
                cxc.map((r) => (
                  <Fragment key={r.eventoId}>
                    <tr
                      onClick={() => setExpandedId(expandedId === r.eventoId ? null : r.eventoId)}
                      className="cursor-pointer border-t hover:bg-neutral-50"
                    >
                      <td className="px-4 py-2">{formatDateOnly(r.fechaEvento)}</td>
                      <td className="px-4 py-2">{r.clienteNombre}</td>
                      <td className="px-4 py-2">{formatCOP(r.valorTotalFacturado)}</td>
                      <td className="px-4 py-2">{formatCOP(r.anticipo)}</td>
                      <td className="px-4 py-2">{formatCOP(r.saldoPendiente)}</td>
                      <td className="px-4 py-2">{formatDateOnly(r.fechaVencimiento)}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO_COLORS[r.estado]}`}>
                          {ESTADO_CARTERA_LABELS[r.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.estado !== 'PAGADA' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAbonoFor({ tipo: 'CXC', eventoId: r.eventoId, saldo: r.saldoPendiente });
                            }}
                            className="text-orange-600 hover:underline"
                          >
                            Abonar
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === r.eventoId && (
                      <tr className="border-t bg-neutral-50">
                        <td colSpan={8} className="px-4 py-3">
                          <p className="mb-1 text-xs font-medium text-neutral-500">
                            Abonos ({r.opcionMenuNombre})
                          </p>
                          {r.abonos.length === 0 ? (
                            <p className="text-xs text-neutral-400">Sin abonos registrados.</p>
                          ) : (
                            <ul className="text-xs text-neutral-600">
                              {r.abonos.map((a) => (
                                <li key={a.id}>
                                  {formatDateOnly(a.fecha)} — {formatCOP(a.valor)} (registrado por{' '}
                                  {a.registeredByName})
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-2">Fecha compra</th>
                <th className="px-4 py-2">Proveedor</th>
                <th className="px-4 py-2">Factura</th>
                <th className="px-4 py-2">Valor factura</th>
                <th className="px-4 py-2">Saldo pendiente</th>
                <th className="px-4 py-2">Vencimiento</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {cxp.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                    No hay cuentas por pagar para este filtro.
                  </td>
                </tr>
              ) : (
                cxp.map((r) => (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="cursor-pointer border-t hover:bg-neutral-50"
                    >
                      <td className="px-4 py-2">{formatDateOnly(r.fechaCompra)}</td>
                      <td className="px-4 py-2">{r.proveedorNombre}</td>
                      <td className="px-4 py-2">{r.facturaNumero}</td>
                      <td className="px-4 py-2">{formatCOP(r.valorFactura)}</td>
                      <td className="px-4 py-2">{formatCOP(r.saldoPendiente)}</td>
                      <td className="px-4 py-2">
                        {r.fechaVencimiento ? formatDateOnly(r.fechaVencimiento) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO_COLORS[r.estado]}`}>
                          {ESTADO_CARTERA_LABELS[r.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.estado !== 'PAGADA' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAbonoFor({ tipo: 'CXP', cuentaId: r.id, saldo: r.saldoPendiente });
                            }}
                            className="text-orange-600 hover:underline"
                          >
                            Abonar
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr className="border-t bg-neutral-50">
                        <td colSpan={8} className="px-4 py-3">
                          <p className="mb-1 text-xs font-medium text-neutral-500">Abonos</p>
                          {r.abonos.length === 0 ? (
                            <p className="text-xs text-neutral-400">Sin abonos registrados.</p>
                          ) : (
                            <ul className="text-xs text-neutral-600">
                              {r.abonos.map((a) => (
                                <li key={a.id}>
                                  {formatDateOnly(a.fecha)} — {formatCOP(a.valor)} (registrado por{' '}
                                  {a.registeredByName})
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {abonoFor && (
        <AbonoModal
          title={abonoFor.tipo === 'CXC' ? 'Registrar abono — Cuenta por cobrar' : 'Registrar abono — Cuenta por pagar'}
          saldoPendiente={abonoFor.saldo}
          onClose={() => setAbonoFor(null)}
          onSubmit={handleAbono}
        />
      )}
    </div>
  );
}
