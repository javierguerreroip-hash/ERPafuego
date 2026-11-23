import { z } from 'zod';
import type { EtapaNegocio } from '../crm/negocio.js';

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
  'desayuno',
  'mexicano',
  'asado',
] as const;

export type CotizacionIcono = (typeof COTIZACION_ICONOS)[number];

export const COTIZACION_ICONO_LABELS: Record<CotizacionIcono, string> = {
  costillas: 'Costillas',
  hamburguesa: 'Hamburguesa',
  paella: 'Paella',
  canapes: 'Canapés',
  sandwich: 'Sándwich',
  desayuno: 'Desayuno',
  mexicano: 'Mexicano',
  asado: 'Plato fuerte asado',
};

// Texto por defecto tomado literalmente de la plantilla de referencia —
// editable en el formulario, no fijo en el código.
export const COTIZACION_CONDICIONES_DEFAULT =
  'Forma de pago: 50% de anticipo y 50% el día del evento.\n' +
  'El servicio se realiza en menaje biodegradable.\n' +
  'Consignar a la cuenta de ahorros Bancolombia No. 43600001941, a nombre de Afuego Eventos S.A.S. - NIT 901530094-4.';

export const cotizacionLineaSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida').max(500),
  cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
  valorUnitario: z.number().nonnegative('El valor unitario no puede ser negativo'),
});

export type CotizacionLineaInput = z.infer<typeof cotizacionLineaSchema>;

// Ítem de menú (propuesta 001, 2026-11-23): además de la descripción, guarda
// QUÉ opción de menú es (su identificador) para que al ganar el negocio la
// venta y la agenda se armen solas, sin volver a preguntar. La cantidad es
// editable (personas o unidades, según el menú). Cotizaciones anteriores no
// lo tienen (opcional) y se enlazan por nombre al editarlas.
export const cotizacionItemSchema = cotizacionLineaSchema.extend({
  opcionMenuId: z.string().min(1).nullable().optional(),
});

export type CotizacionItemInput = z.infer<typeof cotizacionItemSchema>;

export const cotizacionSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  asunto: z.string().min(1, 'El asunto es requerido').max(200),
  lugar: z.string().min(1, 'El lugar es requerido').max(200),
  numeroPersonas: z.number().int().positive('El número de invitados debe ser mayor a 0'),
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  items: z
    .array(cotizacionItemSchema)
    .min(1, 'Agrega al menos un ítem')
    .refine((items) => items.some((i) => Boolean(i.opcionMenuId)), {
      message: 'Elige al menos una opción de menú en los ítems',
    }),
  logistica: z.array(cotizacionLineaSchema).default([]),
  taxRateId: z.string().nullable().optional(),
  // Bloque "DESCRIPCIÓN" del PDF: se precarga con la descripción de las
  // opciones de menú elegidas (editable).
  descripcion: z.string().max(10000, 'La descripción es demasiado larga (máximo 10.000 caracteres)').default(''),
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
  items: CotizacionItemInput[];
  logistica: CotizacionLineaInput[];
  taxRateId: string | null;
  taxRateNombre: string | null;
  descripcion: string;
  condicionesComerciales: string;
  vendedorId: string | null;
  vendedorNombre: string;
  icono: CotizacionIcono | null;
  totales: CotizacionTotales;
  negocioId: string | null;
  // Etapa del negocio del CRM ligado a la cotización (null si no tiene).
  negocioEtapa: EtapaNegocio | null;
  registeredByName: string;
  createdAt: string;
  updatedAt: string;
}
