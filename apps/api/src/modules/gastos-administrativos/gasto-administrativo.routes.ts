import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { getHandler, listHandler, upsertHandler } from './gasto-administrativo.controller.js';

export const gastoAdministrativoRouter = Router();

// Gastos administrativos son información financiera de back-office —
// fuera del alcance de Operación ("compras, inventario, eventos") y
// Ventas ("solo CRM") según la especificación. Solo Administrador.
gastoAdministrativoRouter.use(requireAuth, requireRole('ADMINISTRADOR'));

gastoAdministrativoRouter.get('/', listHandler);
gastoAdministrativoRouter.get('/mes', getHandler);
gastoAdministrativoRouter.post('/', upsertHandler);
