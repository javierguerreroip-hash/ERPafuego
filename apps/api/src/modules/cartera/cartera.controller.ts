import type { NextFunction, Request, Response } from 'express';
import { abonoSchema } from '@erp-afuego/shared';
import * as cxcService from './cxc.service.js';
import * as cxpService from './cxp.service.js';

function parseDateFilters(req: Request) {
  const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
  const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
  return {
    start: startParam ? new Date(`${startParam}T00:00:00.000Z`) : undefined,
    end: endParam ? new Date(`${endParam}T23:59:59.999Z`) : undefined,
  };
}

export async function listCxCHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const clienteId = typeof req.query.clienteId === 'string' ? req.query.clienteId : undefined;
    const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
    const { start, end } = parseDateFilters(req);
    res.json(await cxcService.listCxC({ clienteId, estado, start, end }));
  } catch (error) {
    next(error);
  }
}

export async function addAbonoCxCHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = abonoSchema.parse(req.body);
    await cxcService.addAbonoCxC(req.params.eventoId, input, req.user!.sub);
    res.status(201).json(await cxcService.listCxC({}));
  } catch (error) {
    next(error);
  }
}

export async function listCxPHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const proveedorId = typeof req.query.proveedorId === 'string' ? req.query.proveedorId : undefined;
    const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
    const { start, end } = parseDateFilters(req);
    res.json(await cxpService.listCxP({ proveedorId, estado, start, end }));
  } catch (error) {
    next(error);
  }
}

export async function addAbonoCxPHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = abonoSchema.parse(req.body);
    await cxpService.addAbonoCxP(req.params.cuentaId, input, req.user!.sub);
    res.status(201).json(await cxpService.listCxP({}));
  } catch (error) {
    next(error);
  }
}

export async function totalesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const [cxc, cxp] = await Promise.all([cxcService.listCxC({}), cxpService.listCxP({})]);
    const sum = (rows: { saldoPendiente: number }[]) =>
      Math.round(rows.reduce((s, r) => s + r.saldoPendiente, 0) * 100) / 100;

    res.json({
      totalPorCobrar: sum(cxc),
      totalPorCobrarVencido: sum(cxc.filter((r) => r.estado === 'VENCIDA')),
      totalPorPagar: sum(cxp),
      totalPorPagarVencido: sum(cxp.filter((r) => r.estado === 'VENCIDA')),
    });
  } catch (error) {
    next(error);
  }
}
