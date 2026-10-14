import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getReportHandler } from '../controllers/report.controller';

const router = Router();

router.get('/', authMiddleware, getReportHandler);

export default router;
