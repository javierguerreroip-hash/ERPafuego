import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  addAbonoCxCHandler,
  addAbonoCxPHandler,
  listCxCHandler,
  listCxPHandler,
  totalesHandler,
} from './cartera.controller.js';

export const carteraRouter = Router();

// Cartera es información financiera de back-office — igual que Estado de
// Resultados y Gastos Administrativos, solo Administrador.
carteraRouter.use(requireAuth, requireRole('ADMINISTRADOR', 'OPERACION', 'VENTAS'));

carteraRouter.get('/totales', totalesHandler);
carteraRouter.get('/cxc', listCxCHandler);
carteraRouter.post('/cxc/:eventoId/abonos', addAbonoCxCHandler);
carteraRouter.get('/cxp', listCxPHandler);
carteraRouter.post('/cxp/:cuentaId/abonos', addAbonoCxPHandler);
