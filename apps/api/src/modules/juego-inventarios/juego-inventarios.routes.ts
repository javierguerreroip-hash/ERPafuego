import { Router } from 'express';
import { READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { reporteHandler } from './juego-inventarios.controller.js';

export const juegoInventariosRouter = Router();

// Solo lectura desde el 2026-09-24: el registro del conteo físico se
// trasladó al módulo de Inventario (ver inventario.routes.ts); aquí solo
// se consulta el CMV que resulta de ese dato.
juegoInventariosRouter.use(requireAuth, requireRole(...READ_ACCESS_ROLES));

juegoInventariosRouter.get('/', reporteHandler);
