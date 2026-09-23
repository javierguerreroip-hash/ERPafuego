import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './proveedor.controller.js';

export const proveedorRouter = Router();

proveedorRouter.use(requireAuth);

proveedorRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
proveedorRouter.post('/', requireRole(...FULL_ACCESS_ROLES), createHandler);
proveedorRouter.put('/:id', requireRole(...FULL_ACCESS_ROLES), updateHandler);
proveedorRouter.patch('/:id/active', requireRole(...FULL_ACCESS_ROLES), setActiveHandler);
