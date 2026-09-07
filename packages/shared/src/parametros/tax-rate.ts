import { z } from 'zod';

// Parámetros fiscales configurables (nunca fijos en el código, porque la
// DIAN puede cambiarlos): IVA 19%, IVA 5%, Impuesto al Consumo 8%, u otros
// que se agreguen. Se seleccionan por evento (Módulo 3) para calcular el
// valor después de impuestos.
export const taxRateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  rate: z
    .number()
    .min(0, 'La tasa no puede ser negativa')
    .max(1, 'Expresa la tasa como fracción (0.19 = 19%), no como porcentaje entero'),
});

export type TaxRateInput = z.infer<typeof taxRateSchema>;

export interface TaxRateDTO extends TaxRateInput {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
