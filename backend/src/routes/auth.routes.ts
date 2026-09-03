import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators';

const router = Router();

router.post('/register', validate(registerSchema, 'body'), (req, res) => authController.register(req, res));
router.post('/login', validate(loginSchema, 'body'), (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.me(req, res));

export default router;
