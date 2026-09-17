import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  deleteHandler,
  ganarHandler,
  getResumenHandler,
  getVendedoresHandler,
  listHandler,
  perderHandler,
  updateGanadoHandler,
  updateHandler,
} from './negocio.controller.js';

export const negocioRouter = Router();

// CRM: Administrador (acceso total) y Ventas ("solo CRM" por spec).
negocioRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

negocioRouter.get('/resumen', getResumenHandler);
// Debe ir antes de "/:id" — si no, Express interpretaría "vendedores"
// como un id de negocio y nunca llegaría aquí.
negocioRouter.get('/vendedores', getVendedoresHandler);
negocioRouter.get('/', listHandler);
negocioRouter.post('/', createHandler);
negocioRouter.put('/:id', updateHandler);
negocioRouter.put('/:id/venta', updateGanadoHandler);
negocioRouter.patch('/:id/perder', perderHandler);
negocioRouter.patch('/:id/ganar', ganarHandler);
negocioRouter.delete('/:id', deleteHandler);
