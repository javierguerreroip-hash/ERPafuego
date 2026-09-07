import type { Turno, User } from '@prisma/client';
import type { TurnoAdminInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

type TurnoWithUser = Turno & { user: Pick<User, 'name'> };

function serialize(turno: TurnoWithUser) {
  const horasTrabajadas = turno.horaSalida
    ? Math.round(((turno.horaSalida.getTime() - turno.horaEntrada.getTime()) / 3600000) * 100) / 100
    : null;
  return {
    id: turno.id,
    userId: turno.userId,
    empleadoNombre: turno.user.name,
    horaEntrada: turno.horaEntrada.toISOString(),
    horaSalida: turno.horaSalida ? turno.horaSalida.toISOString() : null,
    horasTrabajadas,
  };
}

export async function marcarEntrada(userId: string) {
  const abierto = await prisma.turno.findFirst({ where: { userId, horaSalida: null } });
  if (abierto) {
    throw new HttpError(409, 'Ya tienes un turno abierto — márcalo como salida antes de abrir otro');
  }
  const turno = await prisma.turno.create({
    data: { userId, horaEntrada: new Date() },
    include: { user: { select: { name: true } } },
  });
  return serialize(turno);
}

export async function marcarSalida(userId: string, horaSalida?: string) {
  const abierto = await prisma.turno.findFirst({ where: { userId, horaSalida: null } });
  if (!abierto) {
    throw new HttpError(404, 'No tienes un turno abierto para marcar salida');
  }
  const salida = horaSalida ? new Date(horaSalida) : new Date();
  if (salida <= abierto.horaEntrada) {
    throw new HttpError(400, 'La hora de salida debe ser posterior a la hora de entrada');
  }
  const turno = await prisma.turno.update({
    where: { id: abierto.id },
    data: { horaSalida: salida },
    include: { user: { select: { name: true } } },
  });
  return serialize(turno);
}

export async function listTurnos(filters: { userId?: string; start?: Date; end?: Date }) {
  const turnos = await prisma.turno.findMany({
    where: {
      userId: filters.userId,
      horaEntrada: filters.start && filters.end ? { gte: filters.start, lte: filters.end } : undefined,
    },
    include: { user: { select: { name: true } } },
    orderBy: { horaEntrada: 'desc' },
  });
  return turnos.map(serialize);
}

export async function adminCreateTurno(input: TurnoAdminInput) {
  const empleado = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!empleado) {
    throw new HttpError(404, 'Empleado no encontrado');
  }
  const horaEntrada = new Date(input.horaEntrada);
  const horaSalida = input.horaSalida ? new Date(input.horaSalida) : null;
  if (horaSalida && horaSalida <= horaEntrada) {
    throw new HttpError(400, 'La hora de salida debe ser posterior a la hora de entrada');
  }
  const turno = await prisma.turno.create({
    data: { userId: input.userId, horaEntrada, horaSalida },
    include: { user: { select: { name: true } } },
  });
  return serialize(turno);
}

export async function adminUpdateTurno(id: string, input: TurnoAdminInput) {
  const existing = await prisma.turno.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Turno no encontrado');
  }
  const horaEntrada = new Date(input.horaEntrada);
  const horaSalida = input.horaSalida ? new Date(input.horaSalida) : null;
  if (horaSalida && horaSalida <= horaEntrada) {
    throw new HttpError(400, 'La hora de salida debe ser posterior a la hora de entrada');
  }
  const turno = await prisma.turno.update({
    where: { id },
    data: { userId: input.userId, horaEntrada, horaSalida },
    include: { user: { select: { name: true } } },
  });
  return serialize(turno);
}

export async function listEmpleadosCocina() {
  const empleados = await prisma.user.findMany({
    where: { role: 'COCINA_NOMINA' },
    select: { id: true, name: true, active: true },
    orderBy: { name: 'asc' },
  });
  return empleados;
}

export async function deleteTurno(id: string) {
  const existing = await prisma.turno.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Turno no encontrado');
  }
  await prisma.turno.delete({ where: { id } });
}
