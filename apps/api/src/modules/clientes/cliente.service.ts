import type { Cliente } from '@prisma/client';
import type { ClienteInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { registrarCambio } from '../auditoria/auditoria.service.js';

function serialize(cliente: Cliente) {
  return {
    id: cliente.id,
    name: cliente.name,
    identificacion: cliente.identificacion,
    telefono: cliente.telefono,
    correo: cliente.correo,
    direccion: cliente.direccion,
    ciudad: cliente.ciudad,
    tipoCliente: cliente.tipoCliente,
    active: cliente.active,
    createdAt: cliente.createdAt.toISOString(),
    updatedAt: cliente.updatedAt.toISOString(),
  };
}

export async function listClientes() {
  const clientes = await prisma.cliente.findMany({ orderBy: { name: 'asc' } });
  return clientes.map(serialize);
}

export async function createCliente(input: ClienteInput, userId: string) {
  const cliente = await prisma.cliente.create({ data: input });
  await registrarCambio({
    modelo: 'Cliente',
    registroId: cliente.id,
    registroNombre: cliente.name,
    accion: 'CREATE',
    detalle: input,
    userId,
  });
  return serialize(cliente);
}

export async function updateCliente(id: string, input: ClienteInput, userId: string) {
  await findClienteOrThrow(id);
  const cliente = await prisma.cliente.update({ where: { id }, data: input });
  await registrarCambio({
    modelo: 'Cliente',
    registroId: cliente.id,
    registroNombre: cliente.name,
    accion: 'UPDATE',
    detalle: input,
    userId,
  });
  return serialize(cliente);
}

export async function setClienteActive(id: string, active: boolean, userId: string) {
  await findClienteOrThrow(id);
  const cliente = await prisma.cliente.update({ where: { id }, data: { active } });
  await registrarCambio({
    modelo: 'Cliente',
    registroId: cliente.id,
    registroNombre: cliente.name,
    accion: active ? 'ACTIVATE' : 'DEACTIVATE',
    userId,
  });
  return serialize(cliente);
}

async function findClienteOrThrow(id: string) {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new HttpError(404, 'Cliente no encontrado');
  }
  return cliente;
}
