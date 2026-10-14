import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';
import { createTaskSchema, taskFilterSchema, updateTaskSchema } from '../schemas/task.schema';
import {
  createTaskHandler,
  deleteTaskHandler,
  getTaskHandler,
  listTasksHandler,
  updateTaskHandler,
} from '../controllers/task.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', validateMiddleware(taskFilterSchema, 'query'), listTasksHandler);
router.post('/', validateMiddleware(createTaskSchema), createTaskHandler);
router.get('/:id', getTaskHandler);
router.patch('/:id', validateMiddleware(updateTaskSchema), updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

export default router;
