import type { NextFunction, Request, Response } from 'express';
import { eventoConsumoSchema, eventoConsumoUpdateSchema, eventoSchema } from '@erp-afuego/shared';
import { assertDeleteAuthorized } from '../../middleware/delete-auth.js';
import * as eventoService from './evento.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await eventoService.listEventos());
  } catch (error) {
    next(error);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await eventoService.getEvento(req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = eventoSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.status(201).json(await eventoService.createEvento(input, registeredById));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = eventoSchema.parse(req.body);
    res.json(await eventoService.updateEvento(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function addConsumoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = eventoConsumoSchema.parse(req.body);
    res.status(201).json(await eventoService.addConsumo(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function updateConsumoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = eventoConsumoUpdateSchema.parse(req.body);
    res.json(
      await eventoService.updateConsumoQuantity(req.params.id, req.params.consumoId, input.quantity),
    );
  } catch (error) {
    next(error);
  }
}

export async function removeConsumoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await eventoService.removeConsumo(req.params.id, req.params.consumoId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    assertDeleteAuthorized(req);
    await eventoService.deleteEvento(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
