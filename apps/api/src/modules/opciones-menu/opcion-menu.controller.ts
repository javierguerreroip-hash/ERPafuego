import type { NextFunction, Request, Response } from 'express';
import { opcionMenuSchema } from '@erp-afuego/shared';
import * as opcionMenuService from './opcion-menu.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await opcionMenuService.listOpcionesMenu());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = opcionMenuSchema.parse(req.body);
    res.status(201).json(await opcionMenuService.createOpcionMenu(input));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = opcionMenuSchema.parse(req.body);
    res.json(await opcionMenuService.updateOpcionMenu(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function setActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await opcionMenuService.setOpcionMenuActive(req.params.id, Boolean(req.body.active)));
  } catch (error) {
    next(error);
  }
}
