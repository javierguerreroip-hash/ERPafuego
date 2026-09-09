import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { reporteHandler, setInicialHandler } from './inventario.controller.js';

export const inventarioRouter = Router();

// Módulo 4: solo Administrador y Operación (spec: "Operación — compras,
// inventario, eventos").
inventarioRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

inventarioRouter.get('/', reporteHandler);
inventarioRouter.post('/inicial', setInicialHandler);
