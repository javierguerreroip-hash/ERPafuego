import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  addConsumoHandler,
  createHandler,
  getHandler,
  listHandler,
  removeConsumoHandler,
  updateConsumoHandler,
  updateHandler,
} from './evento.controller.js';

export const eventoRouter = Router();

// Módulo 3: solo Administrador y Operación (spec: "Operación — compras,
// inventario, eventos"; Ventas trabaja desde el CRM, que se integrará en la
// Fase 10).
eventoRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION'));

eventoRouter.get('/', listHandler);
eventoRouter.post('/', createHandler);
eventoRouter.get('/:id', getHandler);
eventoRouter.put('/:id', updateHandler);
eventoRouter.post('/:id/consumos', addConsumoHandler);
eventoRouter.put('/:id/consumos/:consumoId', updateConsumoHandler);
eventoRouter.delete('/:id/consumos/:consumoId', removeConsumoHandler);
