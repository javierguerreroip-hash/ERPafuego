import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  addAbonoCxCHandler,
  addAbonoCxPHandler,
  listCxCHandler,
  listCxPHandler,
  totalesHandler,
} from './cartera.controller.js';

export const carteraRouter = Router();

carteraRouter.use(requireAuth);

carteraRouter.get('/totales', requireRole(...READ_ACCESS_ROLES), totalesHandler);
carteraRouter.get('/cxc', requireRole(...READ_ACCESS_ROLES), listCxCHandler);
carteraRouter.post('/cxc/:eventoId/abonos', requireRole(...FULL_ACCESS_ROLES), addAbonoCxCHandler);
carteraRouter.get('/cxp', requireRole(...READ_ACCESS_ROLES), listCxPHandler);
carteraRouter.post('/cxp/:cuentaId/abonos', requireRole(...FULL_ACCESS_ROLES), addAbonoCxPHandler);
