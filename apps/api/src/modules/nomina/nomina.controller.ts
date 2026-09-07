import type { NextFunction, Request, Response } from 'express';
import {
  diaFestivoSchema,
  marcarSalidaSchema,
  parametroNominaSchema,
  turnoAdminSchema,
} from '@erp-afuego/shared';
import { HttpError } from '../../middleware/error.middleware.js';
import * as parametroService from './parametro-nomina.service.js';
import * as festivoService from './dia-festivo.service.js';
import * as turnoService from './turno.service.js';
import * as liquidacionService from './liquidacion.service.js';

// --- Parámetros ---

export async function getParametrosHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await parametroService.getParametros());
  } catch (error) {
    next(error);
  }
}

export async function updateParametrosHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = parametroNominaSchema.parse(req.body);
    res.json(await parametroService.updateParametros(input));
  } catch (error) {
    next(error);
  }
}

// --- Días festivos ---

export async function listFestivosHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await festivoService.listFestivos());
  } catch (error) {
    next(error);
  }
}

export async function createFestivoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = diaFestivoSchema.parse(req.body);
    res.status(201).json(await festivoService.createFestivo(input));
  } catch (error) {
    next(error);
  }
}

export async function deleteFestivoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await festivoService.deleteFestivo(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// --- Turnos ---

export async function marcarEntradaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await turnoService.marcarEntrada(req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function marcarSalidaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = marcarSalidaSchema.parse(req.body);
    res.json(await turnoService.marcarSalida(req.user!.sub, input.horaSalida));
  } catch (error) {
    next(error);
  }
}

// Cocina/Nómina solo ve sus propios turnos ("solo su módulo") — se fuerza
// el userId desde el token, ignorando cualquier query param.
export async function listTurnosHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user!.role === 'ADMINISTRADOR';
    const userId = isAdmin && typeof req.query.userId === 'string' ? req.query.userId : req.user!.sub;
    const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
    const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
    const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : undefined;
    const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : undefined;
    res.json(await turnoService.listTurnos({ userId, start, end }));
  } catch (error) {
    next(error);
  }
}

export async function listEmpleadosHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await turnoService.listEmpleadosCocina());
  } catch (error) {
    next(error);
  }
}

export async function adminCreateTurnoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = turnoAdminSchema.parse(req.body);
    res.status(201).json(await turnoService.adminCreateTurno(input));
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateTurnoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = turnoAdminSchema.parse(req.body);
    res.json(await turnoService.adminUpdateTurno(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function deleteTurnoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await turnoService.deleteTurno(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// --- Liquidación ---

// Cocina/Nómina solo puede liquidar su propio período.
export async function getLiquidacionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user!.role === 'ADMINISTRADOR';
    const userId = isAdmin && typeof req.query.userId === 'string' ? req.query.userId : req.user!.sub;

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

    res.json(await liquidacionService.getLiquidacion(userId, start, end));
  } catch (error) {
    next(error);
  }
}
