import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, getOrdersQuerySchema, orderIdParamSchema, updateOrderStatusSchema, cancelOrderSchema } from '../validators';

const router = Router();

router.post('/', authenticate, validate(createOrderSchema, 'body'), (req, res) => orderController.createOrder(req, res));
router.get('/', authenticate, validate(getOrdersQuerySchema, 'query'), (req, res) => orderController.getOrders(req, res));
router.get('/:id', authenticate, validate(orderIdParamSchema, 'params'), (req, res) => orderController.getOrderById(req, res));
router.put('/:id/status', authenticate, validate(orderIdParamSchema, 'params'), validate(updateOrderStatusSchema, 'body'), (req, res) => orderController.updateStatus(req, res));
router.post('/:id/cancel', authenticate, validate(orderIdParamSchema, 'params'), validate(cancelOrderSchema, 'body'), (req, res) => orderController.cancelOrder(req, res));

export default router;
