import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import type { UserCreateInput, UserUpdateInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { registrarCambio } from '../auditoria/auditoria.service.js';

// Nunca se expone passwordHash en las respuestas de la API.
function serialize(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
  return users.map(serialize);
}

export async function createUser(input: UserCreateInput, userId: string) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, role: input.role, passwordHash },
  });
  // Nunca la contraseña en el detalle del log de auditoría, ni siquiera hasheada.
  await registrarCambio({
    modelo: 'Usuario',
    registroId: user.id,
    registroNombre: `${user.name} (${user.email})`,
    accion: 'CREATE',
    detalle: { name: input.name, email: input.email, role: input.role },
    userId,
  });
  return serialize(user);
}

export async function updateUser(id: string, input: UserUpdateInput, userId: string) {
  await findUserOrThrow(id);
  const user = await prisma.user.update({
    where: { id },
    data: { name: input.name, role: input.role },
  });
  await registrarCambio({
    modelo: 'Usuario',
    registroId: user.id,
    registroNombre: `${user.name} (${user.email})`,
    accion: 'UPDATE',
    detalle: input,
    userId,
  });
  return serialize(user);
}

// El propio administrador no puede desactivarse a sí mismo — evita que se
// quede sin acceso al sistema por error.
export async function setUserActive(id: string, active: boolean, requestedById: string) {
  if (id === requestedById && !active) {
    throw new HttpError(400, 'No puedes desactivar tu propio usuario');
  }
  await findUserOrThrow(id);
  const user = await prisma.user.update({ where: { id }, data: { active } });
  await registrarCambio({
    modelo: 'Usuario',
    registroId: user.id,
    registroNombre: `${user.name} (${user.email})`,
    accion: active ? 'ACTIVATE' : 'DEACTIVATE',
    userId: requestedById,
  });
  return serialize(user);
}

async function findUserOrThrow(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return user;
}
