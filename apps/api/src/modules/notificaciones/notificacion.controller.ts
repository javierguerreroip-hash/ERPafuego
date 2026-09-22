import type { NextFunction, Request, Response } from 'express';
import * as notificacionService from './notificacion.service.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await notificacionService.listarNotificaciones(req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function resumenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await notificacionService.contarNoLeidas(req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function marcarLeidasHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await notificacionService.marcarComoLeidas(req.user!.sub);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
