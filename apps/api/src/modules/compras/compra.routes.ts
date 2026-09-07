import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { createHandler, listHandler } from './compra.controller.js';

export const compraRouter = Router();

// Módulo 2: solo Administrador y Operación (spec: "Operación — compras,
// inventario, eventos").
compraRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION'));

compraRouter.get('/', listHandler);
compraRouter.post('/', createHandler);
