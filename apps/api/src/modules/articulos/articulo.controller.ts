import type { NextFunction, Request, Response } from 'express';
import { articuloSchema } from '@erp-afuego/shared';
import { assertDeleteAuthorized } from '../../middleware/delete-auth.js';
import * as articuloService from './articulo.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await articuloService.listArticulos());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = articuloSchema.parse(req.body);
    res.status(201).json(await articuloService.createArticulo(input));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = articuloSchema.parse(req.body);
    res.json(await articuloService.updateArticulo(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function setActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await articuloService.setArticuloActive(req.params.id, Boolean(req.body.active)));
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    assertDeleteAuthorized(req);
    await articuloService.deleteArticulo(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
