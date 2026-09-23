import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { getHandler, listHandler, upsertHandler } from './gasto-administrativo.controller.js';

export const gastoAdministrativoRouter = Router();

gastoAdministrativoRouter.use(requireAuth);

gastoAdministrativoRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
gastoAdministrativoRouter.get('/mes', requireRole(...READ_ACCESS_ROLES), getHandler);
gastoAdministrativoRouter.post('/', requireRole(...FULL_ACCESS_ROLES), upsertHandler);
