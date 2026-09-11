import { z } from 'zod';

// Módulo — CRM de Ventas (docs/spec_erp_afuego.md). "Cliente" aquí es
// texto libre (nombre, identificación opcional, teléfono) porque el CRM
// gestiona prospectos que todavía pueden no existir como Cliente
// registrado en el Módulo 1 — se busca/crea automáticamente al ganar.
export const ETAPAS_NEGOCIO = ['COTIZADO', 'GANADO', 'PERDIDO'] as const;

export type EtapaNegocio = (typeof ETAPAS_NEGOCIO)[number];

export const ETAPA_NEGOCIO_LABELS: Record<EtapaNegocio, string> = {
  COTIZADO: 'Cotizado',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
};

export const negocioSchema = z.object({
  clienteNombre: z.string().min(1, 'El nombre o razón social es requerido').max(200),
  clienteIdentificacion: z.string().max(50).default(''),
  telefono: z.string().max(50).default(''),
  nombreEvento: z.string().min(1, 'Describe el evento').max(200),
  fechaEvento: z.string().min(1, 'La fecha del evento es requerida'),
  valorAntesImpuestos: z.number().nonnegative('El valor no puede ser negativo'),
});

export type NegocioInput = z.infer<typeof negocioSchema>;

export interface NegocioDTO extends NegocioInput {
  id: string;
  etapa: EtapaNegocio;
  eventoId: string | null;
  vendedorNombre: string;
  createdAt: string;
  updatedAt: string;
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
