import { z } from 'zod';
import { ARTICULO_CATEGORIAS } from './articulo.js';

// La categoría de lo que provee un proveedor reutiliza las categorías de
// Articulo (materia prima, mano de obra, transporte, artístico, menaje) para
// no duplicar taxonomías (docs/spec_erp_afuego.md, sección 1.3).
export const proveedorSchema = z.object({
  name: z.string().min(1, 'El nombre o razón social es requerido').max(200),
  identificacion: z.string().min(1, 'El NIT es requerido').max(50),
  telefono: z.string().max(50).default(''),
  correo: z
    .string()
    .default('')
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Correo inválido',
    }),
  categoria: z.enum(ARTICULO_CATEGORIAS),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;

export interface ProveedorDTO extends ProveedorInput {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
