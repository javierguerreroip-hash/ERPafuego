import type { OpcionMenu } from '@prisma/client';
import type { OpcionMenuInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { registrarCambio } from '../auditoria/auditoria.service.js';

function serialize(opcion: OpcionMenu) {
  return {
    id: opcion.id,
    name: opcion.name,
    category: opcion.category,
    description: opcion.description,
    priceType: opcion.priceType,
    price: Number(opcion.price),
    active: opcion.active,
    createdAt: opcion.createdAt.toISOString(),
    updatedAt: opcion.updatedAt.toISOString(),
  };
}

export async function listOpcionesMenu() {
  const opciones = await prisma.opcionMenu.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return opciones.map(serialize);
}

export async function createOpcionMenu(input: OpcionMenuInput, userId: string) {
  await assertNameAvailable(input.name);
  const opcion = await prisma.opcionMenu.create({ data: input });
  await registrarCambio({
    modelo: 'OpcionMenu',
    registroId: opcion.id,
    registroNombre: opcion.name,
    accion: 'CREATE',
    detalle: input,
    userId,
  });
  return serialize(opcion);
}

export async function updateOpcionMenu(id: string, input: OpcionMenuInput, userId: string) {
  await findOpcionOrThrow(id);
  await assertNameAvailable(input.name, id);
  const opcion = await prisma.opcionMenu.update({ where: { id }, data: input });
  await registrarCambio({
    modelo: 'OpcionMenu',
    registroId: opcion.id,
    registroNombre: opcion.name,
    accion: 'UPDATE',
    detalle: input,
    userId,
  });
  return serialize(opcion);
}

export async function setOpcionMenuActive(id: string, active: boolean, userId: string) {
  await findOpcionOrThrow(id);
  const opcion = await prisma.opcionMenu.update({ where: { id }, data: { active } });
  await registrarCambio({
    modelo: 'OpcionMenu',
    registroId: opcion.id,
    registroNombre: opcion.name,
    accion: active ? 'ACTIVATE' : 'DEACTIVATE',
    userId,
  });
  return serialize(opcion);
}

async function assertNameAvailable(name: string, excludeId?: string) {
  const existing = await prisma.opcionMenu.findFirst({
    where: excludeId ? { name, NOT: { id: excludeId } } : { name },
  });
  if (existing) {
    throw new HttpError(409, `Ya existe una opción de menú con el nombre "${name}"`);
  }
}

async function findOpcionOrThrow(id: string) {
  const opcion = await prisma.opcionMenu.findUnique({ where: { id } });
  if (!opcion) {
    throw new HttpError(404, 'Opción de menú no encontrada');
  }
  return opcion;
}
