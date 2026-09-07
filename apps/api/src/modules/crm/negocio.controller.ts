import type { NextFunction, Request, Response } from 'express';
import { ganarNegocioSchema, negocioSchema } from '@erp-afuego/shared';
import * as negocioService from './negocio.service.js';

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
