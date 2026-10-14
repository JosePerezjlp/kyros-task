import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Autenticación requerida'));
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  // Validate three-segment JWT structure
  const parts = token.split('.');
  if (parts.length !== 3) {
    return next(new AppError(401, 'Formato de token inválido'));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Token inválido o expirado'));
  }
}
