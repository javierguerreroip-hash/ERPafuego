import type { NextFunction, Request, Response } from 'express';
import { inventarioFinalFisicoSchema, inventarioInicialSchema } from '@erp-afuego/shared';
import { HttpError } from '../../middleware/error.middleware.js';
import * as inventarioService from './inventario.service.js';

export async function reporteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
    const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
    if (!startParam || !endParam) {
      throw new HttpError(400, 'Los parámetros "start" y "end" son requeridos');
    }

    // UTC explícito: debe coincidir exactamente con cómo se guarda
    // InventarioInicial.fecha (ver inventario.service.ts) para que la
    // búsqueda exacta por fecha de inicio de período funcione sin importar
    // la zona horaria del servidor.
    const start = new Date(`${startParam}T00:00:00.000Z`);
    const end = new Date(`${endParam}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new HttpError(400, 'Rango de fechas inválido');
    }

    res.json(await inventarioService.getInventarioReporte(start, end));
  } catch (error) {
    next(error);
  }
}

export async function setInicialHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inventarioInicialSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.json(await inventarioService.setInventarioInicial(input, registeredById));
  } catch (error) {
    next(error);
  }
}

export async function setFinalFisicoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = inventarioFinalFisicoSchema.parse(req.body);
    const registeredById = req.user!.sub;
    res.json(await inventarioService.setInventarioFinalFisico(input, registeredById));
  } catch (error) {
    next(error);
  }
}
