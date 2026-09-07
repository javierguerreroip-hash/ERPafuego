import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { loginHandler, meHandler } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', loginHandler);
authRouter.get('/me', requireAuth, meHandler);
