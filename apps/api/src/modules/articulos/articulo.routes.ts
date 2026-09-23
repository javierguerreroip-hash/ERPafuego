import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  deleteHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './articulo.controller.js';

export const articuloRouter = Router();

articuloRouter.use(requireAuth);

articuloRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
articuloRouter.post('/', requireRole(...FULL_ACCESS_ROLES), createHandler);
articuloRouter.put('/:id', requireRole(...FULL_ACCESS_ROLES), updateHandler);
articuloRouter.patch('/:id/active', requireRole(...FULL_ACCESS_ROLES), setActiveHandler);
articuloRouter.delete('/:id', requireRole(...FULL_ACCESS_ROLES), deleteHandler);
