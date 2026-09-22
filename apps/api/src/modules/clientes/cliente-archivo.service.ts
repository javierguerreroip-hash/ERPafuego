import type { ClienteArchivo, User } from '@prisma/client';
import { CLIENTE_ARCHIVO_MAX_SIZE_BYTES, type ClienteArchivoUploadInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

type ArchivoWithUploadedBy = ClienteArchivo & { uploadedBy: Pick<User, 'name'> };

function serialize(archivo: ArchivoWithUploadedBy) {
  return {
    id: archivo.id,
    clienteId: archivo.clienteId,
    nombreArchivo: archivo.nombreArchivo,
    mimeType: archivo.mimeType,
    size: archivo.size,
    uploadedByName: archivo.uploadedBy.name,
    createdAt: archivo.createdAt.toISOString(),
  };
}

async function findClienteOrThrow(clienteId: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }
  return cliente;
}

export async function listArchivos(clienteId: string) {
  await findClienteOrThrow(clienteId);
  const archivos = await prisma.clienteArchivo.findMany({
    where: { clienteId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return archivos.map(serialize);
}

export async function uploadArchivo(
  clienteId: string,
  input: ClienteArchivoUploadInput,
  uploadedById: string,
) {
  await findClienteOrThrow(clienteId);

  let contenido: Buffer;
  try {
    contenido = Buffer.from(input.contenidoBase64, 'base64');
  } catch {
    throw new HttpError(400, 'El archivo no es válido');
  }
  if (contenido.length === 0) {
    throw new HttpError(400, 'El archivo está vacío');
  }
  if (contenido.length > CLIENTE_ARCHIVO_MAX_SIZE_BYTES) {
    throw new HttpError(413, 'El archivo no puede superar 3 MB');
  }

  const archivo = await prisma.clienteArchivo.create({
    data: {
      clienteId,
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

// Trae el contenido completo en base64 para que el navegador reconstruya
// el archivo y dispare la descarga — evita depender de una respuesta
// binaria a través de la función serverless (ver decisión en el README).
export async function getArchivoConContenido(clienteId: string, archivoId: string) {
  const archivo = await prisma.clienteArchivo.findFirst({
    where: { id: archivoId, clienteId },
    include: { uploadedBy: { select: { name: true } } },
  });
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  return {
    ...serialize(archivo),
    // Buffer.from(...) explícito: en el entorno empaquetado de la función
    // serverless, Prisma puede devolver la columna Bytes como Uint8Array
    // en vez de un Buffer real — .toString('base64') en un Uint8Array
    // plano no hace lo que parece (usa el toString() genérico del array,
    // "137,80,78,71,..." en vez de base64), lo que rompía la descarga en
    // el navegador (atob: "string no está correctamente codificado").
    contenidoBase64: Buffer.from(archivo.contenido).toString('base64'),
  };
}

export async function deleteArchivo(clienteId: string, archivoId: string) {
  const archivo = await prisma.clienteArchivo.findFirst({ where: { id: archivoId, clienteId } });
  if (!archivo) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  await prisma.clienteArchivo.delete({ where: { id: archivoId } });
}
