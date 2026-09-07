import type { Prisma } from '@prisma/client';
import type { AgendaEventoInput, AgendaEventoUpdateInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularEstadoAnticipo, calcularSaldoPendiente } from './agenda.calculations.js';

const includeRelations = {
  evento: { include: { cliente: true, opcionMenu: true } },
  vendedor: true,
} satisfies Prisma.AgendaEventoInclude;

type AgendaEventoWithRelations = Prisma.AgendaEventoGetPayload<{ include: typeof includeRelations }>;

function serialize(agenda: AgendaEventoWithRelations) {
  const valorAntesImpuestos = Number(agenda.evento.valorAntesImpuestos);
  const anticipo = Number(agenda.anticipo);

  return {
    id: agenda.id,
    eventoId: agenda.eventoId,
    fecha: agenda.evento.fecha.toISOString(),
    clienteNombre: agenda.evento.cliente.name,
    opcionMenuNombre: agenda.evento.opcionMenu.name,
    numeroPersonas: agenda.evento.numeroPersonas,
    valorAntesImpuestos,
    personaContacto: agenda.personaContacto,
    telefonoContacto: agenda.telefonoContacto,
    direccion: agenda.direccion,
    horaServicio: agenda.horaServicio,
    anticipo,
    saldoPendiente: calcularSaldoPendiente(valorAntesImpuestos, anticipo),
    estadoAnticipo: calcularEstadoAnticipo(valorAntesImpuestos, anticipo),
    observaciones: agenda.observaciones,
    vendedorId: agenda.vendedorId,
    vendedorNombre: agenda.vendedor?.name ?? null,
    createdAt: agenda.createdAt.toISOString(),
    updatedAt: agenda.updatedAt.toISOString(),
  };
}

export async function listAgenda(filters: {
  start?: Date;
  end?: Date;
  vendedorId?: string;
  estado?: string;
}) {
  const registros = await prisma.agendaEvento.findMany({
    where: {
      vendedorId: filters.vendedorId,
      evento:
        filters.start && filters.end ? { fecha: { gte: filters.start, lte: filters.end } } : undefined,
    },
    include: includeRelations,
    orderBy: { evento: { fecha: 'asc' } },
  });

  const serializados = registros.map(serialize);
  if (!filters.estado) return serializados;
  return serializados.filter((r) => r.estadoAnticipo === filters.estado);
}

// Eventos del Módulo 3 que todavía no tienen registro en la Agenda — para
// el selector del formulario de creación manual.
export async function listEventosDisponibles() {
  const eventos = await prisma.evento.findMany({
    where: { agenda: null },
    include: { cliente: true, opcionMenu: true },
    orderBy: { fecha: 'desc' },
  });
  return eventos.map((e) => ({
    id: e.id,
    fecha: e.fecha.toISOString(),
    clienteNombre: e.cliente.name,
    opcionMenuNombre: e.opcionMenu.name,
    numeroPersonas: e.numeroPersonas,
    valorAntesImpuestos: Number(e.valorAntesImpuestos),
  }));
}

export async function createAgendaEvento(input: AgendaEventoInput) {
  const evento = await prisma.evento.findUnique({ where: { id: input.eventoId } });
  if (!evento) {
    throw new HttpError(404, 'Evento no encontrado');
  }
  const existing = await prisma.agendaEvento.findUnique({ where: { eventoId: input.eventoId } });
  if (existing) {
    throw new HttpError(409, 'Este evento ya tiene un registro en la Agenda');
  }

  const agenda = await prisma.agendaEvento.create({
    data: {
      eventoId: input.eventoId,
      personaContacto: input.personaContacto,
      telefonoContacto: input.telefonoContacto,
      direccion: input.direccion,
      horaServicio: input.horaServicio,
      anticipo: input.anticipo,
      observaciones: input.observaciones,
      vendedorId: input.vendedorId ?? null,
    },
    include: includeRelations,
  });
  return serialize(agenda);
}

export async function updateAgendaEvento(id: string, input: AgendaEventoUpdateInput) {
  const existing = await prisma.agendaEvento.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Registro de agenda no encontrado');
  }
  const agenda = await prisma.agendaEvento.update({
    where: { id },
    data: {
      personaContacto: input.personaContacto,
      telefonoContacto: input.telefonoContacto,
      direccion: input.direccion,
      horaServicio: input.horaServicio,
      anticipo: input.anticipo,
      observaciones: input.observaciones,
      vendedorId: input.vendedorId ?? null,
    },
    include: includeRelations,
  });
  return serialize(agenda);
}

export async function listVendedores() {
  return prisma.user.findMany({
    where: { role: 'VENTAS' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function deleteAgendaEvento(id: string) {
  const existing = await prisma.agendaEvento.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Registro de agenda no encontrado');
  }
  await prisma.agendaEvento.delete({ where: { id } });
}
