import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { createHandler, listHandler, setActiveHandler, updateHandler } from './user.controller.js';

export const userRouter = Router();

// Solo Administrador gestiona usuarios (crear vendedores, operación y
// empleados de cocina) — es el único rol con este módulo en el menú.
userRouter.use(requireAuth, requireRole('ADMINISTRADOR'));

userRouter.get('/', listHandler);
userRouter.post('/', createHandler);
userRouter.put('/:id', updateHandler);
userRouter.patch('/:id/active', setActiveHandler);
