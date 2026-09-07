import { z } from 'zod';
import type { CondicionPago } from '../compras/compra.js';

// Módulo — Cartera: Cuentas por Cobrar (CxC) y por Pagar (CxP)
// (docs/spec_erp_afuego.md). Estado siempre se calcula, nunca se edita
// manualmente.
export const ESTADOS_CARTERA = ['PENDIENTE', 'PAGADA', 'VENCIDA'] as const;

export type EstadoCartera = (typeof ESTADOS_CARTERA)[number];

export const ESTADO_CARTERA_LABELS: Record<EstadoCartera, string> = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
};

export const abonoSchema = z.object({
  valor: z.number().positive('El abono debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
});

export type AbonoInput = z.infer<typeof abonoSchema>;

export interface AbonoDTO {
  id: string;
  valor: number;
  fecha: string;
  registeredByName: string;
  createdAt: string;
}

// CxC: un registro por cada Evento (ver decisión en el README — todo
// Evento del Módulo 3 se considera "facturado" para efectos de cartera,
// no existe un paso de facturación separado en el sistema). Vencimiento =
// fecha del evento.
export interface CuentaPorCobrarDTO {
  eventoId: string;
  clienteNombre: string;
  opcionMenuNombre: string;
  fechaEvento: string;
  valorTotalFacturado: number;
  anticipo: number;
  saldoPendiente: number;
  fechaVencimiento: string;
  estado: EstadoCartera;
  abonos: AbonoDTO[];
}

// CxP: un registro por cada factura (proveedor + número de factura),
// agrupando todas las líneas de Compra que la componen — solo para
// compras a crédito (una compra de contado ya está saldada).
export interface CuentaPorPagarDTO {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  facturaNumero: string;
  fechaCompra: string;
  valorFactura: number;
  condicionPago: CondicionPago;
  fechaVencimiento: string | null;
  saldoPendiente: number;
  estado: EstadoCartera;
  abonos: AbonoDTO[];
}

export interface CarteraTotalesDTO {
  totalPorCobrar: number;
  totalPorCobrarVencido: number;
  totalPorPagar: number;
  totalPorPagarVencido: number;
}
