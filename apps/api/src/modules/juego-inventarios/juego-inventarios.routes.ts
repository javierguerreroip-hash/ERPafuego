import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { reporteHandler, setFinalFisicoHandler } from './juego-inventarios.controller.js';

export const juegoInventariosRouter = Router();

// Módulo de inventario: solo Administrador y Operación, igual que
// Compras/Eventos/Inventario.
juegoInventariosRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION'));

juegoInventariosRouter.get('/', reporteHandler);
juegoInventariosRouter.post('/final-fisico', setFinalFisicoHandler);
