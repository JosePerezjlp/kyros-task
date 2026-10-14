import { Router } from 'express';
import { validateMiddleware } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { registerHandler, loginHandler } from '../controllers/auth.controller';

const router = Router();

router.post('/register', validateMiddleware(registerSchema), registerHandler);
router.post('/login', validateMiddleware(loginSchema), loginHandler);

export default router;
