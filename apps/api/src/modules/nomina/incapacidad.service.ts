import type { Incapacidad, User } from '@prisma/client';
import type { IncapacidadInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

type IncapacidadWithRelations = Incapacidad & {
  user: Pick<User, 'name'>;
  registeredBy: Pick<User, 'name'>;
};

function serialize(incapacidad: IncapacidadWithRelations) {
  return {
    id: incapacidad.id,
    userId: incapacidad.userId,
    empleadoNombre: incapacidad.user.name,
    fecha: incapacidad.fecha.toISOString(),
    observaciones: incapacidad.observaciones,
    registeredByName: incapacidad.registeredBy.name,
    createdAt: incapacidad.createdAt.toISOString(),
  };
}

export async function listIncapacidades(filters: { userId?: string; start?: Date; end?: Date }) {
  const incapacidades = await prisma.incapacidad.findMany({
    where: {
      userId: filters.userId,
      fecha: filters.start && filters.end ? { gte: filters.start, lte: filters.end } : undefined,
    },
    include: { user: { select: { name: true } }, registeredBy: { select: { name: true } } },
    orderBy: { fecha: 'desc' },
  });
  return incapacidades.map(serialize);
}

export async function createIncapacidad(input: IncapacidadInput, registeredById: string) {
  const empleado = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);
  const existente = await prisma.incapacidad.findUnique({
    where: { userId_fecha: { userId: input.userId, fecha } },
  });
  if (existente) {
    throw new HttpError(409, 'Ya hay una incapacidad registrada para ese empleado en esa fecha');
  }
  const incapacidad = await prisma.incapacidad.create({
    data: {
      userId: input.userId,
      fecha,
      observaciones: input.observaciones,
      registeredById,
    },
    include: { user: { select: { name: true } }, registeredBy: { select: { name: true } } },
  });
  return serialize(incapacidad);
}

export async function deleteIncapacidad(id: string) {
  const existente = await prisma.incapacidad.findUnique({ where: { id } });
  if (!existente) {
    throw new HttpError(404, 'Incapacidad no encontrada');
  }
  await prisma.incapacidad.delete({ where: { id } });
}
