import type { NextFunction, Request, Response } from 'express';
import { userCreateSchema, userUpdateSchema } from '@erp-afuego/shared';
import * as userService from './user.service.js';

export async function listHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await userService.listUsers());
  } catch (error) {
    next(error);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = userCreateSchema.parse(req.body);
    res.status(201).json(await userService.createUser(input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = userUpdateSchema.parse(req.body);
    res.json(await userService.updateUser(req.params.id, input, req.user!.sub));
  } catch (error) {
    next(error);
  }
}

export async function setActiveHandler(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await userService.setUserActive(req.params.id, Boolean(req.body.active), req.user!.sub),
    );
  } catch (error) {
    next(error);
  }
}
