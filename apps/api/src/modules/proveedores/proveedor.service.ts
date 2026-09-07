import type { Proveedor } from '@prisma/client';
import type { ProveedorInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

function serialize(proveedor: Proveedor) {
  return {
    id: proveedor.id,
    name: proveedor.name,
    identificacion: proveedor.identificacion,
    telefono: proveedor.telefono,
    correo: proveedor.correo,
    categoria: proveedor.categoria,
    active: proveedor.active,
    createdAt: proveedor.createdAt.toISOString(),
    updatedAt: proveedor.updatedAt.toISOString(),
  };
}

export async function listProveedores() {
  const proveedores = await prisma.proveedor.findMany({ orderBy: { name: 'asc' } });
  return proveedores.map(serialize);
}

export async function createProveedor(input: ProveedorInput) {
  const proveedor = await prisma.proveedor.create({ data: input });
  return serialize(proveedor);
}

export async function updateProveedor(id: string, input: ProveedorInput) {
  await findProveedorOrThrow(id);
  const proveedor = await prisma.proveedor.update({ where: { id }, data: input });
  return serialize(proveedor);
}

export async function setProveedorActive(id: string, active: boolean) {
  await findProveedorOrThrow(id);
  const proveedor = await prisma.proveedor.update({ where: { id }, data: { active } });
  return serialize(proveedor);
}

async function findProveedorOrThrow(id: string) {
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }
  return proveedor;
}
