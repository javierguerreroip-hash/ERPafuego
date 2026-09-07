import type { DiaFestivoInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

function serialize(f: { id: string; fecha: Date; nombre: string }) {
  return { id: f.id, fecha: f.fecha.toISOString().slice(0, 10), nombre: f.nombre };
}

export async function listFestivos() {
  const festivos = await prisma.diaFestivo.findMany({ orderBy: { fecha: 'asc' } });
  return festivos.map(serialize);
}

export async function createFestivo(input: DiaFestivoInput) {
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);
  const existing = await prisma.diaFestivo.findUnique({ where: { fecha } });
  if (existing) {
    throw new HttpError(409, `Ya existe un festivo registrado para el ${input.fecha}`);
  }
  const festivo = await prisma.diaFestivo.create({ data: { fecha, nombre: input.nombre } });
  return serialize(festivo);
}

export async function deleteFestivo(id: string) {
  const festivo = await prisma.diaFestivo.findUnique({ where: { id } });
  if (!festivo) {
    throw new HttpError(404, 'Día festivo no encontrado');
  }
  await prisma.diaFestivo.delete({ where: { id } });
}

// Devuelve un set de fechas ISO (YYYY-MM-DD) para chequeo O(1) en la
// clasificación de turnos.
export async function getFestivosSet(start: Date, end: Date): Promise<Set<string>> {
  const festivos = await prisma.diaFestivo.findMany({
    where: { fecha: { gte: start, lte: end } },
    select: { fecha: true },
  });
  return new Set(festivos.map((f) => f.fecha.toISOString().slice(0, 10)));
}
