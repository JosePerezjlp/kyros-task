import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type ValidateTarget = 'body' | 'query';

export function validateMiddleware(
  schema: ZodSchema,
  target: ValidateTarget = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = target === 'query' ? req.query : req.body;

    // A missing body is parsed as undefined so Zod reports the required fields
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      // Pass ZodError-like structure via AppError mechanism
      const err = new AppError(400, 'Datos inválidos') as AppError & { errors: typeof errors };
      err.errors = errors;
      return next(err);
    }

    if (target === 'query') {
      req.query = result.data as typeof req.query;
    } else {
      req.body = result.data;
    }

    next();
  };
}
