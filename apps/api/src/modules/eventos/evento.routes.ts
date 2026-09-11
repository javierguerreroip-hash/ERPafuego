import { Router } from 'express';
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

// Administrador, Operación y Ventas tienen acceso completo a todos los
// módulos (decisión del negocio).
eventoRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

eventoRouter.get('/', listHandler);
eventoRouter.post('/', createHandler);
// Debe ir antes de "/:id" — si no, Express interpretaría
// "ranking-opciones" como un id de evento y nunca llegaría aquí.
eventoRouter.get('/ranking-opciones', getRankingOpcionesHandler);
eventoRouter.get('/:id', getHandler);
eventoRouter.put('/:id', updateHandler);
eventoRouter.post('/:id/consumos', addConsumoHandler);
eventoRouter.put('/:id/consumos/:consumoId', updateConsumoHandler);
eventoRouter.delete('/:id/consumos/:consumoId', removeConsumoHandler);
eventoRouter.delete('/:id', deleteHandler);
