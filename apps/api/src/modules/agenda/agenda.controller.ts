import type { NextFunction, Request, Response } from 'express';
import { agendaEventoSchema, agendaEventoUpdateSchema } from '@erp-afuego/shared';
import * as agendaService from './agenda.service.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
    const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
    const vendedorId = typeof req.query.vendedorId === 'string' ? req.query.vendedorId : undefined;
    const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;

    const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : undefined;
    const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : undefined;

    res.json(await agendaService.listAgenda({ start, end, vendedorId, estado }));
  } catch (error) {
    next(error);
  }
}

export async function listEventosDisponiblesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await agendaService.listEventosDisponibles());
  } catch (error) {
    next(error);
  }
}

export async function listVendedoresHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await agendaService.listVendedores());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = agendaEventoSchema.parse(req.body);
    res.status(201).json(await agendaService.createAgendaEvento(input));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = agendaEventoUpdateSchema.parse(req.body);
    res.json(await agendaService.updateAgendaEvento(req.params.id, input));
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await agendaService.deleteAgendaEvento(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
