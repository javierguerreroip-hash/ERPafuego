import type { NextFunction, Request, Response } from 'express';
import * as auditoriaService from './auditoria.service.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const modelo = typeof req.query.modelo === 'string' ? req.query.modelo : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    res.json(await auditoriaService.listarAuditoria({ modelo, userId }));
  } catch (error) {
    next(error);
  }
}
