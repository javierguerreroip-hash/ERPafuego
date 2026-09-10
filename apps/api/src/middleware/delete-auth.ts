import type { Request } from 'express';
import { env } from '../config/env.js';
import { HttpError } from './error.middleware.js';

// Control adicional pedido por el negocio (más allá del rol del usuario):
// borrar una venta (Evento) o un artículo pide una contraseña de
// autorización compartida, configurada por variable de entorno
// (DELETE_AUTH_PASSWORD) — nunca fija en el código fuente.
export function assertDeleteAuthorized(req: Request) {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password !== env.DELETE_AUTH_PASSWORD) {
    throw new HttpError(403, 'Contraseña de autorización incorrecta');
  }
}
