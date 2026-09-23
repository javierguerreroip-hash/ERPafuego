import type { NextFunction, Request, Response } from 'express';
import { compraBatchSchema } from '@erp-afuego/shared';
import { assertDeleteAuthorized } from '../../middleware/delete-auth.js';
import * as compraService from './compra.service.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const articuloId = typeof req.query.articuloId === 'string' ? req.query.articuloId : undefined;
    const proveedorId =
      typeof req.query.proveedorId === 'string' ? req.query.proveedorId : undefined;
    // start/end son opcionales (a diferencia de los reportes de período
    // como Inventario/Dashboard) — sin ellos se listan todas las compras,
    // igual que antes de este filtro.
    const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
    const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
    const startDate = startParam ? new Date(`${startParam}T00:00:00.000Z`) : undefined;
    const endDate = endParam ? new Date(`${endParam}T23:59:59.999Z`) : undefined;
    res.json(await compraService.listCompras({ articuloId, proveedorId, startDate, endDate }));
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
