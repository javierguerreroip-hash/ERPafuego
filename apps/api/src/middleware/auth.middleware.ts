import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@erp-afuego/shared';
import { env } from '../config/env.js';
import { runWithRequestContext } from '../lib/request-context.js';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    req.user = payload;
    // El resto de la petición (handler + cualquier llamada a Prisma,
    // incluso dentro de una transacción) corre con el userId disponible
    // para el interceptor de auditoría — ver lib/request-context.ts.
    runWithRequestContext({ userId: payload.sub }, next);
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// Restringe el acceso según el rol del usuario autenticado (control de acceso por módulo)
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tienes permisos para esta acción' });
      return;
    }
    next();
  };
}
