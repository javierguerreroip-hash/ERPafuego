import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  adminCreateTurnoHandler,
  adminUpdateTurnoHandler,
  createFestivoHandler,
  deleteFestivoHandler,
  deleteTurnoHandler,
  getLiquidacionHandler,
  getParametrosHandler,
  listEmpleadosHandler,
  listFestivosHandler,
  listTurnosHandler,
  marcarEntradaHandler,
  marcarSalidaHandler,
  updateParametrosHandler,
} from './nomina.controller.js';

export const nominaRouter = Router();

nominaRouter.use(requireAuth);

// Administrador, Operación y Ventas administran nómina por completo
// (acceso a todos los módulos); Cocina/Nómina solo marca su propia
// entrada/salida y consulta su propia liquidación ("solo su módulo").
const NOMINA_ADMIN_ROLES = ['ADMINISTRADOR', 'OPERACION', 'VENTAS'] as const;

nominaRouter.get('/parametros', requireRole(...NOMINA_ADMIN_ROLES), getParametrosHandler);
nominaRouter.put('/parametros', requireRole(...NOMINA_ADMIN_ROLES), updateParametrosHandler);
nominaRouter.get('/festivos', requireRole(...NOMINA_ADMIN_ROLES), listFestivosHandler);
nominaRouter.post('/festivos', requireRole(...NOMINA_ADMIN_ROLES), createFestivoHandler);
nominaRouter.delete('/festivos/:id', requireRole(...NOMINA_ADMIN_ROLES), deleteFestivoHandler);
nominaRouter.get('/empleados', requireRole(...NOMINA_ADMIN_ROLES), listEmpleadosHandler);

// Turnos: Cocina/Nómina marca su propia entrada/salida; los roles
// administrativos pueden ver todo y corregir cualquier turno.
nominaRouter.post('/turnos/marcar-entrada', requireRole('COCINA_NOMINA'), marcarEntradaHandler);
nominaRouter.put('/turnos/marcar-salida', requireRole('COCINA_NOMINA'), marcarSalidaHandler);
nominaRouter.get(
  '/turnos',
  requireRole(...NOMINA_ADMIN_ROLES, 'COCINA_NOMINA'),
  listTurnosHandler,
);
nominaRouter.post('/turnos', requireRole(...NOMINA_ADMIN_ROLES), adminCreateTurnoHandler);
nominaRouter.put('/turnos/:id', requireRole(...NOMINA_ADMIN_ROLES), adminUpdateTurnoHandler);
nominaRouter.delete('/turnos/:id', requireRole(...NOMINA_ADMIN_ROLES), deleteTurnoHandler);

// Liquidación: Cocina/Nómina solo puede ver la propia ("solo su módulo").
nominaRouter.get(
  '/liquidacion',
  requireRole(...NOMINA_ADMIN_ROLES, 'COCINA_NOMINA'),
  getLiquidacionHandler,
);
