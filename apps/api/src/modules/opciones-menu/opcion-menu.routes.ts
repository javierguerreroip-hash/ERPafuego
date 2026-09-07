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

// Ventas necesita leer el catálogo para cotizar y para ganar negocios en
// el CRM (Fase 10), pero no puede crear/editar opciones de menú.
opcionMenuRouter.get('/', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), listHandler);
opcionMenuRouter.post('/', requireRole('ADMINISTRADOR', 'OPERACION'), createHandler);
opcionMenuRouter.put('/:id', requireRole('ADMINISTRADOR', 'OPERACION'), updateHandler);
opcionMenuRouter.patch('/:id/active', requireRole('ADMINISTRADOR', 'OPERACION'), setActiveHandler);
