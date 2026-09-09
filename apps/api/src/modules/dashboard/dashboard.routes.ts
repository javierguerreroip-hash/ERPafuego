import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { getHandler } from './dashboard.controller.js';

export const dashboardRouter = Router();

// Igual que compras/inventario/eventos: solo Administrador y Operación.
dashboardRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

dashboardRouter.get('/', getHandler);
