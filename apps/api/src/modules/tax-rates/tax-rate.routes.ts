import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './tax-rate.controller.js';

export const taxRateRouter = Router();

taxRateRouter.use(requireAuth);

// Administrador, Operación y Ventas tienen acceso completo; Consulta
// externa solo lectura; Cocina/Nómina no lo necesita.
taxRateRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
taxRateRouter.post('/', requireRole(...FULL_ACCESS_ROLES), createHandler);
taxRateRouter.put('/:id', requireRole(...FULL_ACCESS_ROLES), updateHandler);
taxRateRouter.patch('/:id/active', requireRole(...FULL_ACCESS_ROLES), setActiveHandler);
