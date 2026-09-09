import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  createHandler,
  deleteHandler,
  listEventosDisponiblesHandler,
  listHandler,
  listVendedoresHandler,
  updateHandler,
} from './agenda.controller.js';

export const agendaRouter = Router();

// Igual que Módulo 3 (eventos): solo Administrador y Operación.
agendaRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

agendaRouter.get('/', listHandler);
agendaRouter.get('/eventos-disponibles', listEventosDisponiblesHandler);
agendaRouter.get('/vendedores', listVendedoresHandler);
agendaRouter.post('/', createHandler);
agendaRouter.put('/:id', updateHandler);
agendaRouter.delete('/:id', deleteHandler);
