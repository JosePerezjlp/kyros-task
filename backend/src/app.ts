import express, { Application } from 'express';
import cors from 'cors';
import { healthCheck } from './controllers/health.controller';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import authRouter from './routes/auth.routes';
import taskRouter from './routes/task.routes';
import reportRouter from './routes/report.routes';
import lookupRouter from './routes/lookup.routes';
import adminRouter from './routes/admin';

export function createApp(): Application {
  const app = express();

  // Body parsing
  app.use(express.json());

  // CORS — in production the SPA and the API share the CloudFront origin, so this only
  // matters for local development or when CORS_ORIGIN is set explicitly
  const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined));

  // Public routes (no auth required)
  app.get('/api/health', healthCheck);
  app.use('/api/auth', authRouter);

  // Protected routes (JWT required)
  app.use('/api/tasks', taskRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api', lookupRouter);

  // ADMIN-only maintenance routes
  app.use('/api/admin', adminRouter);

  // 404 handler — must come after all routes
  app.use(notFoundMiddleware);

  // Centralised error handler — must be last
  app.use(errorMiddleware);

  return app;
}
