import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { createHandler, deleteHandler, listHandler } from './compra.controller.js';

export const compraRouter = Router();

// Módulo 2: solo Administrador y Operación (spec: "Operación — compras,
// inventario, eventos").
compraRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

compraRouter.get('/', listHandler);
compraRouter.post('/', createHandler);
// Borrar una compra (post-lanzamiento, 2026-09-22) es más sensible que
// crearla — pedido por el negocio para poder corregir compras de
// prueba, pero solo el Administrador puede hacerlo (a diferencia del
// resto del módulo, que también está abierto a Operación/Ventas).
compraRouter.delete('/:id', requireRole('ADMINISTRADOR'), deleteHandler);
