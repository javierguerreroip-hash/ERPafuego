import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { listHandler, marcarLeidasHandler, resumenHandler } from './notificacion.controller.js';

export const notificacionRouter = Router();

// Mismos roles que la Agenda (única fuente de notificaciones por ahora).
notificacionRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

notificacionRouter.get('/', listHandler);
notificacionRouter.get('/resumen', resumenHandler);
notificacionRouter.post('/marcar-leidas', marcarLeidasHandler);
