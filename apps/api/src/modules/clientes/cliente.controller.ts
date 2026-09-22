import type { NextFunction, Request, Response } from 'express';
import { clienteSchema } from '@erp-afuego/shared';
import * as clienteService from './cliente.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await clienteService.listClientes());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = clienteSchema.parse(req.body);
    res.status(201).json(await clienteService.createCliente(input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = clienteSchema.parse(req.body);
    res.json(await clienteService.updateCliente(req.params.id, input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function setActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await clienteService.setClienteActive(req.params.id, Boolean(req.body.active), req.user!.sub),
    );
  } catch (error) {
    next(error);
  }
}
