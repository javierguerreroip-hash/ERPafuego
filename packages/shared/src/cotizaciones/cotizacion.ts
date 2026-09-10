import { z } from 'zod';

// Módulo — Cotizaciones (post-lanzamiento, 2026-09-10). Genera el
// documento comercial exportable a PDF con el diseño de la plantilla de
// A Fuego, e integra con el CRM (Fase 10): al guardar una cotización se
// crea automáticamente un Negocio en etapa COTIZADO.
export const COTIZACION_VENDEDORES = ['Carlina Duque', 'Javier Guerrero', 'Sergio Restrepo'] as const;

export type CotizacionVendedor = (typeof COTIZACION_VENDEDORES)[number];

// Ilustraciones esquemáticas (blanco y negro, sin fondo) que se pueden
// mostrar en el PDF de la cotización — mismo estilo que la plantilla de
// referencia. Los archivos viven en apps/web/public/cotizacion-icons/.
export const COTIZACION_ICONOS = ['hamburguesa', 'paella', 'canapes', 'sandwich'] as const;

export type CotizacionIcono = (typeof COTIZACION_ICONOS)[number];

export const COTIZACION_ICONO_LABELS: Record<CotizacionIcono, string> = {
  hamburguesa: 'Hamburguesa',
  paella: 'Paella',
  canapes: 'Canapés',
  sandwich: 'Sándwich',
};

// Texto por defecto tomado literalmente de la plantilla de referencia —
// editable en el formulario, no fijo en el código.
export const COTIZACION_CONDICIONES_DEFAULT =
  'Forma de pago: 50% de anticipo y 50% el día del evento.\n' +
  'El servicio se realiza en menaje biodegradable.\n' +
  'Consignar a la cuenta de ahorros No. 00715370042 de Bancolombia, a nombre de Afuego Eventos S.A.S. - NIT 901.530.094-4.';

export const cotizacionLineaSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida').max(500),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  valorUnitario: z.number().nonnegative('El valor unitario no puede ser negativo'),
});

export type CotizacionLineaInput = z.infer<typeof cotizacionLineaSchema>;

export const cotizacionSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  asunto: z.string().min(1, 'El asunto es requerido').max(200),
  lugar: z.string().min(1, 'El lugar es requerido').max(200),
  numeroPersonas: z.number().int().positive('El número de invitados debe ser mayor a 0'),
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido').max(200),
  clienteIdentificacion: z.string().max(50).default(''),
  telefono: z.string().max(50).default(''),
  items: z.array(cotizacionLineaSchema).min(1, 'Agrega al menos un ítem'),
  logistica: z.array(cotizacionLineaSchema).default([]),
  taxRateId: z.string().nullable().optional(),
  condicionesComerciales: z.string().max(2000).default(COTIZACION_CONDICIONES_DEFAULT),
  vendedorNombre: z.enum(COTIZACION_VENDEDORES),
  icono: z.enum(COTIZACION_ICONOS).nullable().optional(),
});

export type CotizacionInput = z.infer<typeof cotizacionSchema>;

export interface CotizacionTotales {
  subtotalItems: number;
  subtotalLogistica: number;
  subtotal: number;
  impuestoValor: number;
  impuestoPorcentaje: number;
  total: number;
}

export interface CotizacionDTO extends CotizacionInput {
  id: string;
  totales: CotizacionTotales;
  taxRateNombre: string | null;
  negocioId: string | null;
  registeredByName: string;
  createdAt: string;
  updatedAt: string;
}
