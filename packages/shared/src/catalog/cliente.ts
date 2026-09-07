import { z } from 'zod';

export const clienteSchema = z.object({
  name: z.string().min(1, 'El nombre o razón social es requerido').max(200),
  identificacion: z.string().min(1, 'La identificación es requerida').max(50),
  telefono: z.string().max(50).default(''),
  correo: z
    .string()
    .default('')
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Correo inválido',
    }),
  direccion: z.string().max(300).default(''),
  ciudad: z.string().max(100).default(''),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export interface ClienteDTO extends ClienteInput {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
