import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './cliente.controller.js';

export const clienteRouter = Router();

clienteRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

clienteRouter.get('/', listHandler);
clienteRouter.post('/', createHandler);
clienteRouter.put('/:id', updateHandler);
clienteRouter.patch('/:id/active', setActiveHandler);
