import type { Abono, User } from '@prisma/client';
import type { AbonoInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularEstadoCartera, calcularSaldoPendiente } from './cartera.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function serializeAbono(abono: Abono & { registeredBy: Pick<User, 'name'> }) {
  return {
    id: abono.id,
    valor: Number(abono.valor),
    fecha: abono.fecha.toISOString(),
    registeredByName: abono.registeredBy.name,
    createdAt: abono.createdAt.toISOString(),
  };
}

export async function listCxC(filters: {
  clienteId?: string;
  estado?: string;
  start?: Date;
  end?: Date;
}) {
  const eventos = await prisma.evento.findMany({
    where: {
      clienteId: filters.clienteId,
      fecha: filters.start && filters.end ? { gte: filters.start, lte: filters.end } : undefined,
    },
    include: {
      cliente: true,
      opcionMenu: true,
      agenda: true,
      abonos: { include: { registeredBy: true }, orderBy: { fecha: 'desc' } },
    },
    orderBy: { fecha: 'desc' },
  });

  const hoy = new Date();
  const resultados = eventos.map((evento) => {
    const valorTotalFacturado = Number(evento.valorDespuesImpuestos);
    const anticipo = evento.agenda ? Number(evento.agenda.anticipo) : 0;
    const totalAbonos = evento.abonos.reduce((sum, a) => sum + Number(a.valor), 0);
    const saldoPendiente = calcularSaldoPendiente(valorTotalFacturado, round2(anticipo + totalAbonos));

    return {
      eventoId: evento.id,
      clienteNombre: evento.cliente.name,
      opcionMenuNombre: evento.opcionMenu.name,
      fechaEvento: evento.fecha.toISOString(),
      valorTotalFacturado,
      anticipo,
      saldoPendiente,
      fechaVencimiento: evento.fecha.toISOString(),
      estado: calcularEstadoCartera(saldoPendiente, evento.fecha, hoy),
      abonos: evento.abonos.map(serializeAbono),
    };
  });

  return filters.estado ? resultados.filter((r) => r.estado === filters.estado) : resultados;
}

export async function addAbonoCxC(eventoId: string, input: AbonoInput, registeredById: string) {
  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) {
    throw new HttpError(404, 'Evento no encontrado');
  }
  await prisma.abono.create({
    data: {
      tipo: 'CXC',
      eventoId,
      valor: input.valor,
      fecha: new Date(input.fecha),
      registeredById,
    },
  });
}
