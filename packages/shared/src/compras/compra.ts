import { z } from 'zod';

// Módulo 2 — Registro de compras (docs/spec_erp_afuego.md).
// Cada compra se registra "ítem por ítem", pero varios ítems pueden
// compartir una misma factura de proveedor. Por eso el formulario captura
// un encabezado de factura (proveedor, fecha, número, condición de pago,
// vencimiento) una sola vez y una lista de ítems (artículo, cantidad,
// precio unitario) — el backend crea un registro de Compra por cada ítem,
// todos con los mismos datos de factura, dentro de una única transacción.
export const CONDICIONES_PAGO = ['CONTADO', 'CREDITO'] as const;

export type CondicionPago = (typeof CONDICIONES_PAGO)[number];

export const CONDICION_PAGO_LABELS: Record<CondicionPago, string> = {
  CONTADO: 'Contado',
  CREDITO: 'Crédito',
};

export const compraItemSchema = z.object({
  articuloId: z.string().min(1, 'Selecciona un artículo'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
});

export type CompraItemInput = z.infer<typeof compraItemSchema>;

export const compraBatchSchema = z
  .object({
    proveedorId: z.string().min(1, 'Selecciona un proveedor'),
    fecha: z.string().min(1, 'La fecha es requerida'),
    facturaNumero: z.string().min(1, 'El número de factura es requerido').max(100),
    condicionPago: z.enum(CONDICIONES_PAGO),
    fechaVencimiento: z.string().nullable().optional(),
    items: z.array(compraItemSchema).min(1, 'Agrega al menos un ítem'),
  })
  .refine((data) => data.condicionPago !== 'CREDITO' || Boolean(data.fechaVencimiento), {
    message: 'La fecha de vencimiento es requerida cuando la condición de pago es a crédito',
    path: ['fechaVencimiento'],
  });

export type CompraBatchInput = z.infer<typeof compraBatchSchema>;

export interface CompraDTO {
  id: string;
  articuloId: string;
  articuloNombre: string;
  articuloCodigo: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  facturaNumero: string;
  condicionPago: CondicionPago;
  fechaVencimiento: string | null;
  registeredByName: string;
  createdAt: string;
}
