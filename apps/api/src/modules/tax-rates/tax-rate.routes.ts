import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './tax-rate.controller.js';

export const taxRateRouter = Router();

taxRateRouter.use(requireAuth);

// Administrador, Operación y Ventas tienen acceso completo a todos los
// módulos (decisión del negocio); Cocina/Nómina no lo necesita.
taxRateRouter.get('/', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), listHandler);
taxRateRouter.post('/', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), createHandler);
taxRateRouter.put('/:id', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), updateHandler);
taxRateRouter.patch(
  '/:id/active',
  requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'),
  setActiveHandler,
);
