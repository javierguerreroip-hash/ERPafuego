import { z } from 'zod';

// Módulo — Cotizaciones (post-lanzamiento, 2026-09-10). Genera el
// documento comercial exportable a PDF con el diseño de la plantilla de
// A Fuego, e integra con el CRM (Fase 10): al guardar una cotización se
// crea automáticamente un Negocio en etapa COTIZADO. Desde 2026-09-21,
// el cliente y el vendedor se seleccionan entre los ya creados en
// Clientes y Usuarios (mismos vendedores que el CRM) — ya no son texto
// libre ni una lista fija (ver decisión en el README).

// Ilustraciones esquemáticas (blanco y negro, sin fondo) que se pueden
// mostrar en el PDF de la cotización — mismo estilo que la plantilla de
// referencia. Los archivos viven en apps/web/public/cotizacion-icons/.
export const COTIZACION_ICONOS = [
  'costillas',
  'hamburguesa',
  'paella',
  'canapes',
  'sandwich',
] as const;

export type CotizacionIcono = (typeof COTIZACION_ICONOS)[number];

export const COTIZACION_ICONO_LABELS: Record<CotizacionIcono, string> = {
  costillas: 'Costillas',
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
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  items: z.array(cotizacionLineaSchema).min(1, 'Agrega al menos un ítem'),
  logistica: z.array(cotizacionLineaSchema).default([]),
  taxRateId: z.string().nullable().optional(),
  condicionesComerciales: z.string().max(2000).default(COTIZACION_CONDICIONES_DEFAULT),
  vendedorId: z.string().min(1, 'Selecciona un vendedor'),
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

export interface CotizacionDTO {
  id: string;
  fecha: string;
  asunto: string;
  lugar: string;
  numeroPersonas: number;
  // Null solo en cotizaciones creadas antes de exigir clienteId/vendedorId
  // (2026-09-21) — toda cotización nueva los trae.
  clienteId: string | null;
  clienteNombre: string;
  clienteIdentificacion: string;
  telefono: string;
  items: CotizacionLineaInput[];
  logistica: CotizacionLineaInput[];
  taxRateId: string | null;
  taxRateNombre: string | null;
  condicionesComerciales: string;
  vendedorId: string | null;
  vendedorNombre: string;
  icono: CotizacionIcono | null;
  totales: CotizacionTotales;
  negocioId: string | null;
  registeredByName: string;
  createdAt: string;
  updatedAt: string;
}
