import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { reporteHandler, setFinalFisicoHandler } from './juego-inventarios.controller.js';

export const juegoInventariosRouter = Router();

juegoInventariosRouter.use(requireAuth);

juegoInventariosRouter.get('/', requireRole(...READ_ACCESS_ROLES), reporteHandler);
juegoInventariosRouter.post(
  '/final-fisico',
  requireRole(...FULL_ACCESS_ROLES),
  setFinalFisicoHandler,
);
