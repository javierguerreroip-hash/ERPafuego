import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../middleware/error.middleware.js';

export async function login({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
