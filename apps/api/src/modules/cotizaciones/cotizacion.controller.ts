import type { NextFunction, Request, Response } from 'express';
import { cotizacionSchema } from '@erp-afuego/shared';
import * as cotizacionService from './cotizacion.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await cotizacionService.listCotizaciones());
  } catch (error) {
    next(error);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await cotizacionService.getCotizacion(req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = cotizacionSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.status(201).json(await cotizacionService.createCotizacion(input, registeredById));
  } catch (error) {
    next(error);
  }
}
