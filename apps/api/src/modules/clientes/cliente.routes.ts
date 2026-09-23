import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  listHandler,
  setActiveHandler,
  updateHandler,
} from './cliente.controller.js';
import {
  deleteHandler as deleteArchivoHandler,
  downloadHandler as downloadArchivoHandler,
  listHandler as listArchivosHandler,
  uploadHandler as uploadArchivoHandler,
} from './cliente-archivo.controller.js';

export const clienteRouter = Router();

clienteRouter.use(requireAuth);

clienteRouter.get('/', requireRole(...READ_ACCESS_ROLES), listHandler);
clienteRouter.post('/', requireRole(...FULL_ACCESS_ROLES), createHandler);
clienteRouter.put('/:id', requireRole(...FULL_ACCESS_ROLES), updateHandler);
clienteRouter.patch('/:id/active', requireRole(...FULL_ACCESS_ROLES), setActiveHandler);

// Adjuntos del cliente — anidados bajo /:id porque solo tienen sentido en
// el contexto de un cliente ya creado (no se puede adjuntar nada a un
// cliente que todavía no existe). Consulta externa puede ver/descargar,
// no subir ni eliminar.
clienteRouter.get('/:id/archivos', requireRole(...READ_ACCESS_ROLES), listArchivosHandler);
clienteRouter.post('/:id/archivos', requireRole(...FULL_ACCESS_ROLES), uploadArchivoHandler);
clienteRouter.get(
  '/:id/archivos/:archivoId',
  requireRole(...READ_ACCESS_ROLES),
  downloadArchivoHandler,
);
clienteRouter.delete(
  '/:id/archivos/:archivoId',
  requireRole(...FULL_ACCESS_ROLES),
  deleteArchivoHandler,
);
