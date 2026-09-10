import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { createHandler, getHandler, listHandler } from './cotizacion.controller.js';

export const cotizacionRouter = Router();

// Mismo acceso que el resto de los módulos comerciales (Administrador,
// Operación, Ventas — decisión del negocio de acceso total).
cotizacionRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

cotizacionRouter.get('/', listHandler);
cotizacionRouter.get('/:id', getHandler);
cotizacionRouter.post('/', createHandler);
