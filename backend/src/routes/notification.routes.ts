import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getNotificationsQuerySchema, notificationIdParamSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', validate(getNotificationsQuerySchema, 'query'), (req, res) => notificationController.getNotifications(req, res));
router.put('/:id/read', validate(notificationIdParamSchema, 'params'), (req, res) => notificationController.markAsRead(req, res));
router.put('/read-all', (req, res) => notificationController.markAllAsRead(req, res));

export default router;
