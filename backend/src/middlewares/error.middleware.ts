import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

// Detected by shape so this middleware does not import Prisma (layer rule)
function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.name === 'PrismaClientKnownRequestError' &&
    (err as Error & { code?: string }).code === 'P2002'
  );
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';

  // AppError — expected domain errors
  if (err instanceof AppError) {
    const errWithErrors = err as AppError & { errors?: Array<{ field: string; message: string }> };
    if (errWithErrors.errors) {
      res.status(err.statusCode).json({
        status: err.statusCode,
        message: err.message,
        timestamp,
        errors: errWithErrors.errors,
      });
    } else {
      res.status(err.statusCode).json({
        status: err.statusCode,
        message: err.message,
        timestamp,
      });
    }
    return;
  }

  // ZodError — validation failures (should usually be handled by validate middleware, but just in case)
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      status: 400,
      message: 'Datos inválidos',
      timestamp,
      errors,
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (isUniqueConstraintError(err)) {
    res.status(409).json({
      status: 409,
      message: 'Ya existe un registro con ese valor',
      timestamp,
    });
    return;
  }

  // Generic unhandled error
  if (isProduction) {
    console.error('[error]', err);
    res.status(500).json({
      status: 500,
      message: 'Error interno del servidor',
      timestamp,
    });
  } else {
    const stack = err instanceof Error ? err.stack : String(err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      status: 500,
      message,
      timestamp,
      stack,
    });
  }
}
