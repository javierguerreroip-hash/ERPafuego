import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  addAbonoCxCHandler,
  addAbonoCxPHandler,
  listCxCHandler,
  listCxPHandler,
  totalesHandler,
  updateAbonoHandler,
} from './cartera.controller.js';

export const carteraRouter = Router();

carteraRouter.use(requireAuth);

carteraRouter.get('/totales', requireRole(...READ_ACCESS_ROLES), totalesHandler);
carteraRouter.get('/cxc', requireRole(...READ_ACCESS_ROLES), listCxCHandler);
carteraRouter.post('/cxc/:eventoId/abonos', requireRole(...FULL_ACCESS_ROLES), addAbonoCxCHandler);
carteraRouter.get('/cxp', requireRole(...READ_ACCESS_ROLES), listCxPHandler);
carteraRouter.post('/cxp/:cuentaId/abonos', requireRole(...FULL_ACCESS_ROLES), addAbonoCxPHandler);
// Editar un abono ya registrado (post-lanzamiento, 2026-09-29) — a
// diferencia de registrar uno nuevo (Administrador/Operación/Ventas),
// corregirlo queda exclusivo de Administrador, pedido explícito del
// negocio. Un solo endpoint para CxC y CxP: el modelo Abono es el mismo.
carteraRouter.put('/abonos/:abonoId', requireRole('ADMINISTRADOR'), updateAbonoHandler);
