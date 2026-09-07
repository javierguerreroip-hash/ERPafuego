import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { getHandler } from './estado-resultados.controller.js';

export const estadoResultadosRouter = Router();

// Estado financiero — igual que Gastos Administrativos, solo Administrador.
estadoResultadosRouter.use(requireAuth, requireRole('ADMINISTRADOR'));

estadoResultadosRouter.get('/', getHandler);
