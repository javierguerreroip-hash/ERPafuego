import { z } from 'zod';

// Módulo — CRM de Ventas (docs/spec_erp_afuego.md). El cliente de un
// negocio se selecciona entre los ya creados en el Módulo 1 (Clientes) —
// no se puede escribir uno nuevo desde el CRM (decisión 2026-09-21, para
// evitar duplicados/errores de digitación). clienteNombre/
// clienteIdentificacion/telefono en el DTO son una copia tomada del
// Cliente al crear/editar el negocio (se recalculan si cambias el
// cliente seleccionado).
export const ETAPAS_NEGOCIO = ['COTIZADO', 'GANADO', 'PERDIDO'] as const;

export type EtapaNegocio = (typeof ETAPAS_NEGOCIO)[number];

export const ETAPA_NEGOCIO_LABELS: Record<EtapaNegocio, string> = {
  COTIZADO: 'Cotizado',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
};

export const negocioSchema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  nombreEvento: z.string().min(1, 'Describe el evento').max(200),
  fechaEvento: z.string().min(1, 'La fecha del evento es requerida'),
  valorAntesImpuestos: z.number().nonnegative('El valor no puede ser negativo'),
  vendedorId: z.string().min(1, 'Selecciona un vendedor'),
});

export type NegocioInput = z.infer<typeof negocioSchema>;

export interface NegocioDTO {
  id: string;
  // Null solo en negocios creados antes de exigir clienteId
  // (2026-09-21) que aún no se han editado — todo negocio nuevo lo trae.
  clienteId: string | null;
  clienteNombre: string;
  clienteIdentificacion: string;
  telefono: string;
  nombreEvento: string;
  fechaEvento: string;
  valorAntesImpuestos: number;
  vendedorId: string;
  etapa: EtapaNegocio;
  eventoId: string | null;
  vendedorNombre: string;
  // Solo tienen valor cuando el negocio está Ganado (vienen de la Venta y
  // la Agenda vinculadas) — null en Cotizado/Perdido.
  numeroPersonas: number | null;
  horaServicio: string | null;
  direccion: string | null;
  createdAt: string;
  updatedAt: string;
}

// Edición de un negocio ya Ganado: por cambios que pide el cliente
// después de aprobar (cambia el número de invitados, el valor, la
// fecha, la hora o el lugar). Actualiza a la vez el Negocio, la Venta
// (Evento del Módulo 3) y la Agenda operativa — igual que "ganar" un
// negocio actualiza varios módulos en una sola transacción.
export const negocioGanadoUpdateSchema = z.object({
  valorAntesImpuestos: z.number().nonnegative('El valor no puede ser negativo'),
  numeroPersonas: z.number().int().positive('El número de personas debe ser mayor a 0'),
  fechaEvento: z.string().min(1, 'La fecha del evento es requerida'),
  horaServicio: z.string().max(20).default(''),
  direccion: z.string().max(300).default(''),
});

export type NegocioGanadoUpdateInput = z.infer<typeof negocioGanadoUpdateSchema>;

// Vendedores disponibles para asignar en el CRM: usuarios activos con rol
// Administrador o Ventas (Operación y Cocina/Nómina no venden).
export interface VendedorDisponibleDTO {
  id: string;
  name: string;
}

// Resumen del CRM por período (post-lanzamiento, 2026-09-11): valor y
// cantidad de negocios por etapa (Cotizado/Ganado/Perdido) — cubre "todo
// lo cotizado" — y la eficiencia comercial (Ganado ÷ total cotizado).
export interface CrmResumenEtapaDTO {
  etapa: EtapaNegocio;
  cantidad: number;
  valor: number;
}

export interface CrmResumenDTO {
  start: string;
  end: string;
  porEtapa: CrmResumenEtapaDTO[];
  totalCotizado: number;
  totalGanado: number;
  eficiencia: number;
}

// Datos que faltan para poder crear el Evento del Módulo 3 al ganar un
// negocio — el CRM no los captura (ver decisión documentada en el README).
export const ganarNegocioSchema = z.object({
  opcionMenuId: z.string().min(1, 'Selecciona una opción de menú'),
  numeroPersonas: z.number().int().positive('El número de personas debe ser mayor a 0'),
  taxRateId: z.string().nullable().optional(),
});

export type GanarNegocioInput = z.infer<typeof ganarNegocioSchema>;
