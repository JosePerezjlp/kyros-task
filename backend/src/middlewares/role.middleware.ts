import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function roleMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError(403, 'Permisos insuficientes'));
  }
  next();
}
