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

// Operación necesita poder leerlas para elegir la tasa al crear un evento,
// y Ventas para ganar negocios en el CRM (Fase 10) — pero solo
// Administrador puede crear/editar parámetros fiscales.
taxRateRouter.get('/', requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'), listHandler);
taxRateRouter.post('/', requireRole('ADMINISTRADOR'), createHandler);
taxRateRouter.put('/:id', requireRole('ADMINISTRADOR'), updateHandler);
taxRateRouter.patch('/:id/active', requireRole('ADMINISTRADOR'), setActiveHandler);
