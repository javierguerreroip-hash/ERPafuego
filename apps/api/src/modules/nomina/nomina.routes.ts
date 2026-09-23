import { Router } from 'express';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES } from '@erp-afuego/shared';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  adminCreateTurnoHandler,
  adminUpdateTurnoHandler,
  createFestivoHandler,
  createIncapacidadHandler,
  deleteFestivoHandler,
  deleteIncapacidadHandler,
  deleteTurnoHandler,
  getLiquidacionHandler,
  getParametrosHandler,
  listEmpleadosHandler,
  listFestivosHandler,
  listIncapacidadesHandler,
  listTurnosHandler,
  marcarEntradaHandler,
  marcarSalidaHandler,
  updateParametrosHandler,
} from './nomina.controller.js';

export const nominaRouter = Router();

nominaRouter.use(requireAuth);

// Administrador, Operación y Ventas administran nómina por completo
// (acceso a todos los módulos); Cocina/Nómina solo marca su propia
// entrada/salida y consulta su propia liquidación ("solo su módulo");
// Consulta externa ve todo en modo lectura, igual que los admin, pero
// nunca puede crear/editar/eliminar nada.
const NOMINA_ADMIN_ROLES = FULL_ACCESS_ROLES;

nominaRouter.get('/parametros', requireRole(...READ_ACCESS_ROLES), getParametrosHandler);
nominaRouter.put('/parametros', requireRole(...NOMINA_ADMIN_ROLES), updateParametrosHandler);
nominaRouter.get('/festivos', requireRole(...READ_ACCESS_ROLES), listFestivosHandler);
nominaRouter.post('/festivos', requireRole(...NOMINA_ADMIN_ROLES), createFestivoHandler);
nominaRouter.delete('/festivos/:id', requireRole(...NOMINA_ADMIN_ROLES), deleteFestivoHandler);
nominaRouter.get('/empleados', requireRole(...READ_ACCESS_ROLES), listEmpleadosHandler);

// Turnos: Cocina/Nómina marca su propia entrada/salida; los roles
// administrativos pueden ver todo y corregir cualquier turno; Consulta
// externa solo puede ver todo.
nominaRouter.post('/turnos/marcar-entrada', requireRole('COCINA_NOMINA'), marcarEntradaHandler);
nominaRouter.put('/turnos/marcar-salida', requireRole('COCINA_NOMINA'), marcarSalidaHandler);
nominaRouter.get(
  '/turnos',
  requireRole(...READ_ACCESS_ROLES, 'COCINA_NOMINA'),
  listTurnosHandler,
);
nominaRouter.post('/turnos', requireRole(...NOMINA_ADMIN_ROLES), adminCreateTurnoHandler);
nominaRouter.put('/turnos/:id', requireRole(...NOMINA_ADMIN_ROLES), adminUpdateTurnoHandler);
nominaRouter.delete('/turnos/:id', requireRole(...NOMINA_ADMIN_ROLES), deleteTurnoHandler);

// Incapacidades: mismo criterio que turnos.
nominaRouter.get(
  '/incapacidades',
  requireRole(...READ_ACCESS_ROLES, 'COCINA_NOMINA'),
  listIncapacidadesHandler,
);
nominaRouter.post('/incapacidades', requireRole(...NOMINA_ADMIN_ROLES), createIncapacidadHandler);
nominaRouter.delete(
  '/incapacidades/:id',
  requireRole(...NOMINA_ADMIN_ROLES),
  deleteIncapacidadHandler,
);

// Liquidación: Cocina/Nómina solo puede ver la propia ("solo su módulo").
nominaRouter.get(
  '/liquidacion',
  requireRole(...READ_ACCESS_ROLES, 'COCINA_NOMINA'),
  getLiquidacionHandler,
);
