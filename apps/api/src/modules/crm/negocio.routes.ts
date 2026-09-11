import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  ganarHandler,
  getResumenHandler,
  listHandler,
  perderHandler,
  updateHandler,
} from './negocio.controller.js';

export const negocioRouter = Router();

// CRM: Administrador (acceso total) y Ventas ("solo CRM" por spec).
negocioRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

negocioRouter.get('/resumen', getResumenHandler);
negocioRouter.get('/', listHandler);
negocioRouter.post('/', createHandler);
negocioRouter.put('/:id', updateHandler);
negocioRouter.patch('/:id/perder', perderHandler);
negocioRouter.patch('/:id/ganar', ganarHandler);
