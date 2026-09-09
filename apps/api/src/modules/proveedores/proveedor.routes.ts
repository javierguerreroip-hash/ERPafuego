import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './proveedor.controller.js';

export const proveedorRouter = Router();

proveedorRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

proveedorRouter.get('/', listHandler);
proveedorRouter.post('/', createHandler);
proveedorRouter.put('/:id', updateHandler);
proveedorRouter.patch('/:id/active', setActiveHandler);
