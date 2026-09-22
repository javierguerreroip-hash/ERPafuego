import type { NotificacionTipo } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';

// Lo llama agenda.service.ts al crear/editar/eliminar un registro de la
// Agenda. Nunca debe tumbar la operación real que la llama.
export async function crearNotificacion(params: {
  tipo: NotificacionTipo;
  mensaje: string;
  agendaEventoId?: string;
  createdById: string;
}) {
  try {
    await prisma.notificacion.create({
      data: {
        tipo: params.tipo,
        mensaje: params.mensaje,
        agendaEventoId: params.agendaEventoId,
        createdById: params.createdById,
      },
    });
  } catch (err) {
    console.error('No se pudo crear la notificación:', err);
  }
}

export async function listarNotificaciones(userId: string) {
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  const vistasHasta = usuario?.notificacionesVistasHasta ?? null;

  const notificaciones = await prisma.notificacion.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return notificaciones.map((n) => ({
    id: n.id,
    tipo: n.tipo as NotificacionTipo,
    mensaje: n.mensaje,
    agendaEventoId: n.agendaEventoId,
    createdByName: n.createdBy?.name ?? null,
    createdAt: n.createdAt.toISOString(),
    leida: vistasHasta !== null && n.createdAt <= vistasHasta,
  }));
}

export async function contarNoLeidas(userId: string) {
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  const vistasHasta = usuario?.notificacionesVistasHasta ?? null;

  const noLeidas = await prisma.notificacion.count({
    where: vistasHasta ? { createdAt: { gt: vistasHasta } } : undefined,
  });
  return { noLeidas };
}

export async function marcarComoLeidas(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { notificacionesVistasHasta: new Date() },
  });
}
