import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { createHandler, deleteHandler, listHandler } from './compra.controller.js';

export const compraRouter = Router();

compraRouter.use(requireAuth);

compraRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
compraRouter.post('/', requireRole(...FULL_ACCESS_ROLES), createHandler);
// Borrar una compra (post-lanzamiento, 2026-09-22) es más sensible que
// crearla — pedido por el negocio para poder corregir compras de
// prueba, pero solo el Administrador puede hacerlo (a diferencia del
// resto del módulo, que también está abierto a Operación/Ventas).
compraRouter.delete('/:id', requireRole('ADMINISTRADOR'), deleteHandler);
