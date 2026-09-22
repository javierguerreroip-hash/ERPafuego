import { z } from 'zod';

// Clasificación del cliente (post-lanzamiento, 2026-09-11) — corporativo
// (empresa) o persona natural.
export const CLIENTE_TIPOS = ['PERSONA_NATURAL', 'CORPORATIVO'] as const;

export type ClienteTipo = (typeof CLIENTE_TIPOS)[number];

export const CLIENTE_TIPO_LABELS: Record<ClienteTipo, string> = {
  PERSONA_NATURAL: 'Persona natural',
  CORPORATIVO: 'Corporativo',
};

export const clienteSchema = z.object({
  name: z.string().min(1, 'El nombre o razón social es requerido').max(200),
  identificacion: z.string().min(1, 'La identificación es requerida').max(50),
  telefono: z.string().max(50).default(''),
  correo: z
    .string()
    .default('')
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Correo inválido',
    }),
  direccion: z.string().max(300).default(''),
  ciudad: z.string().max(100).default(''),
  tipoCliente: z.enum(CLIENTE_TIPOS).default('PERSONA_NATURAL'),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export interface ClienteDTO extends ClienteInput {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Adjuntos del cliente (post-lanzamiento, 2026-09-22): cédula, RUT,
// contrato, etc. El archivo viaja codificado en base64 dentro del mismo
// cuerpo JSON de la petición (no multipart/form-data) — el backend lo
// guarda directamente en la base de datos, sin servicio de
// almacenamiento aparte. 3MB de límite: suficiente para un documento
// escaneado o un contrato en PDF de varias páginas, y deja margen bajo
// el límite de payload de las funciones de Netlify (una vez
// codificado en base64, el tamaño crece ~33%).
export const CLIENTE_ARCHIVO_MAX_SIZE_BYTES = 3 * 1024 * 1024;

export const clienteArchivoUploadSchema = z.object({
  nombreArchivo: z.string().min(1, 'El nombre del archivo es requerido').max(255),
  mimeType: z.string().min(1, 'El tipo de archivo es requerido').max(150),
  contenidoBase64: z.string().min(1, 'El archivo está vacío'),
});

export type ClienteArchivoUploadInput = z.infer<typeof clienteArchivoUploadSchema>;

export interface ClienteArchivoDTO {
  id: string;
  clienteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  uploadedByName: string;
  createdAt: string;
}

export interface ClienteArchivoContenidoDTO extends ClienteArchivoDTO {
  contenidoBase64: string;
}
