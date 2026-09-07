import type { NextFunction, Request, Response } from 'express';
import { loginSchema } from '@erp-afuego/shared';
import { login } from './auth.service.js';

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function meHandler(req: Request, res: Response) {
  res.json({ user: req.user });
}
