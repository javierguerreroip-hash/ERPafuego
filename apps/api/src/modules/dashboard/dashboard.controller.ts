import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../middleware/error.middleware.js';
import * as dashboardService from './dashboard.service.js';

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
    const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
    if (!startParam || !endParam) {
      throw new HttpError(400, 'Los parámetros "start" y "end" son requeridos');
    }

    const start = new Date(`${startParam}T00:00:00.000Z`);
    const end = new Date(`${endParam}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new HttpError(400, 'Rango de fechas inválido');
    }

    res.json(await dashboardService.getDashboard(start, end));
  } catch (error) {
    next(error);
  }
}
