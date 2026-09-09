import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './opcion-menu.controller.js';

export const opcionMenuRouter = Router();

opcionMenuRouter.use(requireAuth);

// Administrador, Operación y Ventas tienen acceso completo a todos los
// módulos (decisión del negocio).
opcionMenuRouter.get('/', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), listHandler);
opcionMenuRouter.post('/', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), createHandler);
opcionMenuRouter.put('/:id', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), updateHandler);
opcionMenuRouter.patch(
  '/:id/active',
  requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'),
  setActiveHandler,
);
