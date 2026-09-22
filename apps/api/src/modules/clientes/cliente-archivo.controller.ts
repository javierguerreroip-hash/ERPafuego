import type { NextFunction, Request, Response } from 'express';
import { clienteArchivoUploadSchema } from '@erp-afuego/shared';
import * as archivoService from './cliente-archivo.service.js';

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await archivoService.listArchivos(req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function uploadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = clienteArchivoUploadSchema.parse(req.body);
    res.status(201).json(await archivoService.uploadArchivo(req.params.id, input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function downloadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await archivoService.getArchivoConContenido(req.params.id, req.params.archivoId));
  } catch (error) {
    next(error);
  }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await archivoService.deleteArchivo(req.params.id, req.params.archivoId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
