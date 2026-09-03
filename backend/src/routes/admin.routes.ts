import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getUsersQuerySchema, userIdParamSchema, updateUserStatusSchema, updateCancellationPolicySchema, disputesQuerySchema, resolveDisputeSchema, disputeIdParamSchema, analyticsQuerySchema } from '../validators';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));
router.get('/analytics', validate(analyticsQuerySchema, 'query'), (req, res) => adminController.getAnalytics(req, res));
router.get('/users', validate(getUsersQuerySchema, 'query'), (req, res) => adminController.getUsers(req, res));
router.put('/users/:id/status', validate(userIdParamSchema, 'params'), validate(updateUserStatusSchema, 'body'), (req, res) => adminController.updateUserStatus(req, res));
router.get('/cancellation-policy', (req, res) => adminController.getCancellationPolicy(req, res));
router.put('/cancellation-policy', validate(updateCancellationPolicySchema, 'body'), (req, res) => adminController.updateCancellationPolicy(req, res));
router.get('/disputes', validate(disputesQuerySchema, 'query'), (req, res) => adminController.getDisputes(req, res));
router.post('/disputes/:id/resolve', validate(disputeIdParamSchema, 'params'), validate(resolveDisputeSchema, 'body'), (req, res) => adminController.resolveDispute(req, res));

export default router;
