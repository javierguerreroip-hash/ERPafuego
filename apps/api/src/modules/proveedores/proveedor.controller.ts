import type { NextFunction, Request, Response } from 'express';
import { proveedorSchema } from '@erp-afuego/shared';
import * as proveedorService from './proveedor.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await proveedorService.listProveedores());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = proveedorSchema.parse(req.body);
    res.status(201).json(await proveedorService.createProveedor(input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = proveedorSchema.parse(req.body);
    res.json(await proveedorService.updateProveedor(req.params.id, input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function setActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await proveedorService.setProveedorActive(req.params.id, Boolean(req.body.active), req.user!.sub),
    );
  } catch (error) {
    next(error);
  }
}
