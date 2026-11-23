import { useState } from 'react';
import type { CotizacionDTO, CotizacionLineaInput } from '@erp-afuego/shared';
import { Modal } from './Modal';
import { generateCotizacionPDF } from '../lib/cotizacion-pdf';
import { formatCOP, formatDateOnly } from '../lib/format';

// Detalle de solo lectura de la cotización de la que nació un negocio del
// CRM (propuesta 001, 2026-11-23): así se ve toda la información sin salir
// del CRM. Para cambiarla se edita la cotización en su módulo.
function LineasTabla({ titulo, lineas }: { titulo: string; lineas: CotizacionLineaInput[] }) {
  if (lineas.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{titulo}</h3>
      <table className="w-full text-left text-xs">
        <thead className="text-neutral-400">
          <tr>
            <th className="py-1 font-medium">Descripción</th>
            <th className="py-1 text-right font-medium">Cant.</th>
            <th className="py-1 text-right font-medium">Vr. unitario</th>
            <th className="py-1 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l, i) => (
            <tr key={i} className="border-t">
              <td className="py-1 pr-2 text-neutral-800">{l.descripcion}</td>
              <td className="py-1 text-right">{l.cantidad}</td>
              <td className="py-1 text-right">{formatCOP(l.valorUnitario)}</td>
              <td className="py-1 text-right">{formatCOP(l.cantidad * l.valorUnitario)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CotizacionDetalleModal({
  cotizacion,
  onClose,
}: {
  cotizacion: CotizacionDTO;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await generateCotizacionPDF({
        fecha: cotizacion.fecha.slice(0, 10),
        asunto: cotizacion.asunto,
        lugar: cotizacion.lugar,
        numeroPersonas: cotizacion.numeroPersonas,
        clienteNombre: cotizacion.clienteNombre,
        items: cotizacion.items,
        logistica: cotizacion.logistica,
        totales: cotizacion.totales,
        condicionesComerciales: cotizacion.condicionesComerciales,
        vendedorNombre: cotizacion.vendedorNombre,
        taxRateNombre: cotizacion.taxRateNombre,
        icono: cotizacion.icono,
        descripcion: cotizacion.descripcion,
      });
    } finally {
      setDownloading(false);
    }
  }

  const t = cotizacion.totales;

  return (
    <Modal title="Cotización del negocio" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <p><span className="text-neutral-400">Asunto: </span>{cotizacion.asunto}</p>
          <p><span className="text-neutral-400">Cliente: </span>{cotizacion.clienteNombre}</p>
          <p><span className="text-neutral-400">Fecha del evento: </span>{formatDateOnly(cotizacion.fecha)}</p>
          <p><span className="text-neutral-400">Lugar: </span>{cotizacion.lugar}</p>
          <p><span className="text-neutral-400">Invitados: </span>{cotizacion.numeroPersonas}</p>
          <p><span className="text-neutral-400">Vendedor: </span>{cotizacion.vendedorNombre}</p>
        </div>

        <LineasTabla titulo="Ítems del menú" lineas={cotizacion.items} />
        <LineasTabla titulo="Logística" lineas={cotizacion.logistica} />

        <div className="space-y-1 border-t pt-2 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatCOP(t.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">{cotizacion.taxRateNombre ?? 'Impuesto'}</span>
            <span>{formatCOP(t.impuestoValor)}</span>
          </div>
          <div className="flex justify-between font-semibold text-neutral-900">
            <span>Total</span>
            <span>{formatCOP(t.total)}</span>
          </div>
        </div>

        {cotizacion.descripcion && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Descripción</h3>
            <p className="whitespace-pre-line text-xs text-neutral-700">{cotizacion.descripcion}</p>
          </div>
        )}
        {cotizacion.condicionesComerciales && (
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Condiciones comerciales
            </h3>
            <p className="whitespace-pre-line text-xs text-neutral-700">{cotizacion.condicionesComerciales}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
            Cerrar
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {downloading ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
