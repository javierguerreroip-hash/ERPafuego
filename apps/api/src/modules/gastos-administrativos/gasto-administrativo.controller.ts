import type { NextFunction, Request, Response } from 'express';
import { gastoAdministrativoSchema } from '@erp-afuego/shared';
import { HttpError } from '../../middleware/error.middleware.js';
import * as gastoService from './gasto-administrativo.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await gastoService.listGastos());
  } catch (error) {
    next(error);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new HttpError(400, 'Los parámetros "year" y "month" son requeridos');
    }
    res.json(await gastoService.getGasto(year, month));
  } catch (error) {
    next(error);
  }
}

export async function upsertHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = gastoAdministrativoSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.json(await gastoService.upsertGasto(input, registeredById));
  } catch (error) {
    next(error);
  }
}
