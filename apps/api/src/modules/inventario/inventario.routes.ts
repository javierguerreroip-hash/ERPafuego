import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { reporteHandler, setFinalFisicoHandler, setInicialHandler } from './inventario.controller.js';

export const inventarioRouter = Router();

inventarioRouter.use(requireAuth);

inventarioRouter.get('/', requireRole(...READ_ACCESS_ROLES), reporteHandler);
inventarioRouter.post('/inicial', requireRole(...FULL_ACCESS_ROLES), setInicialHandler);
// Conteo físico de cierre de período (post-lanzamiento, 2026-09-24) —
// trasladado aquí desde Juego de Inventarios, que ahora solo lo consume.
inventarioRouter.post('/final-fisico', requireRole(...FULL_ACCESS_ROLES), setFinalFisicoHandler);
