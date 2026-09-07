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

// Parámetros legales y calendario de festivos — configuración, solo Administrador.
nominaRouter.get('/parametros', requireRole('ADMINISTRADOR'), getParametrosHandler);
nominaRouter.put('/parametros', requireRole('ADMINISTRADOR'), updateParametrosHandler);
nominaRouter.get('/festivos', requireRole('ADMINISTRADOR'), listFestivosHandler);
nominaRouter.post('/festivos', requireRole('ADMINISTRADOR'), createFestivoHandler);
nominaRouter.delete('/festivos/:id', requireRole('ADMINISTRADOR'), deleteFestivoHandler);
nominaRouter.get('/empleados', requireRole('ADMINISTRADOR'), listEmpleadosHandler);

// Turnos: Cocina/Nómina marca su propia entrada/salida; Administrador
// puede ver todo y corregir cualquier turno.
nominaRouter.post('/turnos/marcar-entrada', requireRole('COCINA_NOMINA'), marcarEntradaHandler);
nominaRouter.put('/turnos/marcar-salida', requireRole('COCINA_NOMINA'), marcarSalidaHandler);
nominaRouter.get('/turnos', requireRole('ADMINISTRADOR', 'COCINA_NOMINA'), listTurnosHandler);
nominaRouter.post('/turnos', requireRole('ADMINISTRADOR'), adminCreateTurnoHandler);
nominaRouter.put('/turnos/:id', requireRole('ADMINISTRADOR'), adminUpdateTurnoHandler);
nominaRouter.delete('/turnos/:id', requireRole('ADMINISTRADOR'), deleteTurnoHandler);

// Liquidación: Cocina/Nómina solo puede ver la propia ("solo su módulo").
nominaRouter.get('/liquidacion', requireRole('ADMINISTRADOR', 'COCINA_NOMINA'), getLiquidacionHandler);
