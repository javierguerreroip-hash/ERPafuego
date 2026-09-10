import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  deleteHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './articulo.controller.js';

export const articuloRouter = Router();

// Módulo 1 (maestros): solo Administrador y Operación (spec: "Operación —
// compras, inventario, eventos", que dependen de estos maestros).
articuloRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

articuloRouter.get('/', listHandler);
articuloRouter.post('/', createHandler);
articuloRouter.put('/:id', updateHandler);
articuloRouter.patch('/:id/active', setActiveHandler);
articuloRouter.delete('/:id', deleteHandler);
