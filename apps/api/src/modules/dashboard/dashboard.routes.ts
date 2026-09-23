import { Router } from 'express';
import { READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { getHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

// Solo lectura para todos los que lo pueden ver, incluida Consulta
// externa — el Dashboard no tiene nada que crear/editar.
dashboardRouter.use(requireAuth, requireRole(...READ_ACCESS_ROLES));

dashboardRouter.get('/', getHandler);
