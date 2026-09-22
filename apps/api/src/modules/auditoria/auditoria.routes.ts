import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { listHandler } from './auditoria.controller.js';

export const auditoriaRouter = Router();

// Historial de "quién editó qué" — solo Administrador (post-lanzamiento,
// 2026-09-22, pedido explícitamente como panel exclusivo del Administrador).
auditoriaRouter.use(requireAuth, requireRole('ADMINISTRADOR'));

auditoriaRouter.get('/', listHandler);
