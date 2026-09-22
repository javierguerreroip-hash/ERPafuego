import { Router } from 'express';
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

clienteRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

clienteRouter.get('/', listHandler);
clienteRouter.post('/', createHandler);
clienteRouter.put('/:id', updateHandler);
clienteRouter.patch('/:id/active', setActiveHandler);

// Adjuntos del cliente — anidados bajo /:id porque solo tienen sentido en
// el contexto de un cliente ya creado (no se puede adjuntar nada a un
// cliente que todavía no existe).
clienteRouter.get('/:id/archivos', listArchivosHandler);
clienteRouter.post('/:id/archivos', uploadArchivoHandler);
clienteRouter.get('/:id/archivos/:archivoId', downloadArchivoHandler);
clienteRouter.delete('/:id/archivos/:archivoId', deleteArchivoHandler);
