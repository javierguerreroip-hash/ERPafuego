import type { Prisma } from '@prisma/client';
import type { AuditAccion } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';

// Lo llama cada servicio de los modelos auditados (ver AUDIT_MODELOS en
// packages/shared) justo después de crear/editar/activar/desactivar/
// eliminar un registro. Nunca debe tumbar la operación real que la
// llama — si guardar el log falla, se registra en la consola del
// servidor y se sigue de largo.
export async function registrarCambio(params: {
  modelo: string;
  registroId: string;
  registroNombre: string;
  accion: AuditAccion;
  detalle?: Prisma.InputJsonValue;
  userId: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        modelo: params.modelo,
        registroId: params.registroId,
        registroNombre: params.registroNombre,
        accion: params.accion,
        detalle: params.detalle,
        userId: params.userId,
      },
    });
  } catch (err) {
    console.error('No se pudo registrar la auditoría:', err);
  }
}

export async function listarAuditoria(filters: { modelo?: string; userId?: string }) {
  const logs = await prisma.auditLog.findMany({
    where: { modelo: filters.modelo, userId: filters.userId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return logs.map((l) => ({
    id: l.id,
    modelo: l.modelo,
    registroId: l.registroId,
    registroNombre: l.registroNombre,
    accion: l.accion as AuditAccion,
    detalle: l.detalle,
    userName: l.user?.name ?? 'Usuario eliminado',
    createdAt: l.createdAt.toISOString(),
  }));
}
