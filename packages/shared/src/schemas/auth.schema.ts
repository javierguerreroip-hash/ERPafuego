import { z } from 'zod';
import { USER_ROLES } from '../roles.js';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
});

export type AuthUser = z.infer<typeof authUserSchema>;
