import { Router } from 'express';
import { READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { getHandler } from './estado-resultados.controller.js';

export const estadoResultadosRouter = Router();

// Solo lectura para todos los que lo pueden ver, incluida Consulta externa.
estadoResultadosRouter.use(requireAuth, requireRole(...READ_ACCESS_ROLES));

estadoResultadosRouter.get('/', getHandler);
