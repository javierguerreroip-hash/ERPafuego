import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Datos inválidos', issues: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ message: 'Ya existe un registro con ese valor único' });
  }
  // P2028 = la transacción tardó más que su límite de tiempo (ver
  // timeout en createCompraBatch, 2026-09-28) — mensaje más claro que el
  // genérico de abajo para cuando una operación con muchos ítems (ej.
  // una factura de compra grande) tarda demasiado en guardarse.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2028') {
    return res.status(504).json({
      message:
        'La operación tenía demasiados ítems y tardó más de lo esperado en guardarse. Intenta dividirla en partes más pequeñas (ej. dos facturas en vez de una).',
    });
  }
  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
