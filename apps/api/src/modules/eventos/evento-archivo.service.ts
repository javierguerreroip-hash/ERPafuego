import type { EventoArchivo, User } from '@prisma/client';
import { EVENTO_ARCHIVO_MAX_SIZE_BYTES, type EventoArchivoUploadInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

type ArchivoWithUploadedBy = EventoArchivo & { uploadedBy: Pick<User, 'name'> };

function serialize(archivo: ArchivoWithUploadedBy) {
  return {
    id: archivo.id,
    eventoId: archivo.eventoId,
    nombreArchivo: archivo.nombreArchivo,
    mimeType: archivo.mimeType,
    size: archivo.size,
    uploadedByName: archivo.uploadedBy.name,
    createdAt: archivo.createdAt.toISOString(),
  };
}

async function findEventoOrThrow(eventoId: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) {
    throw new HttpError(404, 'Evento no encontrado');
  }
  return evento;
}

export async function listArchivos(eventoId: string) {
  await findEventoOrThrow(eventoId);
  const archivos = await prisma.eventoArchivo.findMany({
    where: { eventoId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return archivos.map(serialize);
}

export async function uploadArchivo(
  eventoId: string,
  input: EventoArchivoUploadInput,
  uploadedById: string,
) {
  await findEventoOrThrow(eventoId);

  const contenido = Buffer.from(input.contenidoBase64, 'base64');
  if (contenido.length === 0) {
    throw new HttpError(400, 'El archivo está vacío');
  }
  if (contenido.length > EVENTO_ARCHIVO_MAX_SIZE_BYTES) {
    throw new HttpError(413, 'El archivo no puede superar 3 MB');
  }

  const archivo = await prisma.eventoArchivo.create({
    data: {
      eventoId,
      nombreArchivo: input.nombreArchivo,
      mimeType: input.mimeType,
      size: contenido.length,
      contenido,
      uploadedById,
    },
    include: { uploadedBy: { select: { name: true } } },
  });
  return serialize(archivo);
}

// Igual que en Cliente: el contenido viaja en base64 dentro del JSON y el
// navegador reconstruye el archivo (evita respuestas binarias a través de
// la función serverless). Buffer.from(...) explícito porque Prisma puede
// devolver la columna Bytes como Uint8Array en el entorno empaquetado.
export async function getArchivoConContenido(eventoId: string, archivoId: string) {
  const archivo = await prisma.eventoArchivo.findFirst({
    where: { id: archivoId, eventoId },
    include: { uploadedBy: { select: { name: true } } },
  });
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  return {
    ...serialize(archivo),
    contenidoBase64: Buffer.from(archivo.contenido).toString('base64'),
  };
}

export async function deleteArchivo(eventoId: string, archivoId: string) {
  const archivo = await prisma.eventoArchivo.findFirst({ where: { id: archivoId, eventoId } });
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  await prisma.eventoArchivo.delete({ where: { id: archivoId } });
}
