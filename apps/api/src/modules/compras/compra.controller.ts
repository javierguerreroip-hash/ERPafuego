import type { NextFunction, Request, Response } from 'express';
import { compraBatchSchema } from '@erp-afuego/shared';
import { assertDeleteAuthorized } from '../../middleware/delete-auth.js';
import * as compraService from './compra.service.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const articuloId = typeof req.query.articuloId === 'string' ? req.query.articuloId : undefined;
    const proveedorId =
      typeof req.query.proveedorId === 'string' ? req.query.proveedorId : undefined;
    res.json(await compraService.listCompras({ articuloId, proveedorId }));
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = compraBatchSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.status(201).json(await compraService.createCompraBatch(input, registeredById));
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    assertDeleteAuthorized(req);
    await compraService.deleteCompra(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
