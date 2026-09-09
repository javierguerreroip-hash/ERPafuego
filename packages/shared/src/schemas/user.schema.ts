import { z } from 'zod';
import { USER_ROLES } from '../roles.js';

// Gestión de usuarios (módulo Usuarios, solo Administrador) — permite crear
// vendedores, personal de operación y empleados de cocina desde la
// interfaz en vez de tocar la base de datos directamente. El password solo
// se pide al crear; editar un usuario existente solo cambia nombre/rol (el
// cambio de contraseña queda fuera de alcance por ahora — no lo pidió la
// especificación).
export const userCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(USER_ROLES),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  role: z.enum(USER_ROLES),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
