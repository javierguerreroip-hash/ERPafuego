import type { NextFunction, Request, Response } from 'express';
import { taxRateSchema } from '@erp-afuego/shared';
import * as taxRateService from './tax-rate.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taxRateService.listTaxRates());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = taxRateSchema.parse(req.body);
    res.status(201).json(await taxRateService.createTaxRate(input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = taxRateSchema.parse(req.body);
    res.json(await taxRateService.updateTaxRate(req.params.id, input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function setActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await taxRateService.setTaxRateActive(req.params.id, Boolean(req.body.active), req.user!.sub),
    );
  } catch (error) {
    next(error);
  }
}
