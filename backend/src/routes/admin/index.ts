import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import { masterDataRouter } from './masterData.routes';

// Every /api/admin/* route requires a valid JWT with role ADMIN
const router = Router();

router.use(authMiddleware, roleMiddleware);

router.use('/categories', masterDataRouter('category'));
router.use('/priorities', masterDataRouter('priority'));

export default router;
