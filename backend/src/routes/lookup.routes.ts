import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { maintenanceHandlers } from '../controllers/maintenance.controller';

// Read-only master data for dropdowns, available to any authenticated user.
// Auth is applied per route because this router is mounted on /api.
const router = Router();

router.get('/categories', authMiddleware, maintenanceHandlers('category').list);
router.get('/priorities', authMiddleware, maintenanceHandlers('priority').list);

export default router;
