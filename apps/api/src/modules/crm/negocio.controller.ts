import type { NextFunction, Request, Response } from 'express';
import { ganarNegocioSchema, negocioSchema } from '@erp-afuego/shared';
import { HttpError } from '../../middleware/error.middleware.js';
import * as negocioService from './negocio.service.js';

export async function getResumenHandler(req: Request, res: Response, next: NextFunction) {
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
    res.json(await negocioService.getResumenCrm(start, end));
  } catch (error) {
    next(error);
  }
}

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await negocioService.listNegocios());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = negocioSchema.parse(req.body);
    res.status(201).json(await negocioService.createNegocio(input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = negocioSchema.parse(req.body);
    res.json(await negocioService.updateNegocio(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function perderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await negocioService.perderNegocio(req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function ganarHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = ganarNegocioSchema.parse(req.body);
    res.json(await negocioService.ganarNegocio(req.params.id, input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}
