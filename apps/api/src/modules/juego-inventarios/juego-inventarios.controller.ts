import type { NextFunction, Request, Response } from 'express';
import { inventarioFinalFisicoSchema } from '@erp-afuego/shared';
import { HttpError } from '../../middleware/error.middleware.js';
import * as juegoInventariosService from './juego-inventarios.service.js';

export async function reporteHandler(req: Request, res: Response, next: NextFunction) {
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

    res.json(await juegoInventariosService.getJuegoInventariosReporte(start, end));
  } catch (error) {
    next(error);
  }
}

export async function setFinalFisicoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inventarioFinalFisicoSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.json(await juegoInventariosService.setInventarioFinalFisico(input, registeredById));
  } catch (error) {
    next(error);
  }
}
