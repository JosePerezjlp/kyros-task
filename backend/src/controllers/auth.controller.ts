import { Request, Response, NextFunction } from 'express';
import { register, login } from '../services/auth.service';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await register(req.body as RegisterInput);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await login(req.body as LoginInput);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
