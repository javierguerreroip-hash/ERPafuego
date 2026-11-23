import type { NextFunction, Request, Response } from 'express';
import { ganarNegocioSchema, negocioGanadoUpdateSchema, negocioSchema } from '@erp-afuego/shared';
import { HttpError } from '../../middleware/error.middleware.js';
import { assertDeleteAuthorized } from '../../middleware/delete-auth.js';
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

export async function getVendedoresHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await negocioService.listVendedoresDisponibles());
  } catch (error) {
    next(error);
  }
}

// Propuesta 001 · entrega 3: los negocios ya no se crean a mano; nacen al
// guardar una cotización (que los deja en "Cotizado").
export async function createHandler(_req: Request, _res: Response, next: NextFunction) {
  next(
    new HttpError(
      409,
      'Los negocios ya no se crean aquí: nacen al guardar una cotización, desde el módulo de Cotizaciones.',
    ),
  );
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = negocioSchema.parse(req.body);
    res.json(await negocioService.updateNegocio(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function updateGanadoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = negocioGanadoUpdateSchema.parse(req.body);
    res.json(await negocioService.updateNegocioGanado(req.params.id, input));
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

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    assertDeleteAuthorized(req);
    await negocioService.deleteNegocio(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
