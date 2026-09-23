import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  addConsumoHandler,
  createHandler,
  deleteHandler,
  getHandler,
  getRankingOpcionesHandler,
  listHandler,
  removeConsumoHandler,
  updateConsumoHandler,
  updateHandler,
} from './evento.controller.js';

export const eventoRouter = Router();

eventoRouter.use(requireAuth);

eventoRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
eventoRouter.post('/', requireRole(...FULL_ACCESS_ROLES), createHandler);
// Debe ir antes de "/:id" — si no, Express interpretaría
// "ranking-opciones" como un id de evento y nunca llegaría aquí.
eventoRouter.get('/ranking-opciones', requireRole(...READ_ACCESS_ROLES), getRankingOpcionesHandler);
eventoRouter.get('/:id', requireRole(...READ_ACCESS_ROLES), getHandler);
eventoRouter.put('/:id', requireRole(...FULL_ACCESS_ROLES), updateHandler);
eventoRouter.post('/:id/consumos', requireRole(...FULL_ACCESS_ROLES), addConsumoHandler);
eventoRouter.put(
  '/:id/consumos/:consumoId',
  requireRole(...FULL_ACCESS_ROLES),
  updateConsumoHandler,
);
eventoRouter.delete(
  '/:id/consumos/:consumoId',
  requireRole(...FULL_ACCESS_ROLES),
  removeConsumoHandler,
);
eventoRouter.delete('/:id', requireRole(...FULL_ACCESS_ROLES), deleteHandler);
