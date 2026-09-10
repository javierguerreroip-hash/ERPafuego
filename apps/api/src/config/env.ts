import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es requerida'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Contraseña de autorización para eliminar ventas (Evento) y artículos —
  // pedida explícitamente por el negocio como control adicional más allá
  // del rol del usuario. No tiene valor por defecto a propósito, para que
  // nunca quede un valor plano en el código fuente.
  DELETE_AUTH_PASSWORD: z.string().min(1, 'DELETE_AUTH_PASSWORD es requerida'),
});

export const env = envSchema.parse(process.env);
