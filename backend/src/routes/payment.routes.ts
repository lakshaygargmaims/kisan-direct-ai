import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPaymentSchema, refundSchema, paymentOrderIdParamSchema } from '../validators';
import { prisma } from '../utils/prisma';

const router = Router();

router.post('/create', authenticate, validate(createPaymentSchema, 'body'), (req, res) => paymentController.createPayment(req, res));
router.get('/order/:orderId', authenticate, validate(paymentOrderIdParamSchema, 'params'), (req, res) => paymentController.getPayments(req, res));
router.post('/:orderId/refund', authenticate, validate(paymentOrderIdParamSchema, 'params'), validate(refundSchema, 'body'), (req, res) => paymentController.processRefund(req, res));
router.get('/settlements', authenticate, (req, res) => paymentController.getSettlements(req, res));

// Wallet - derived from payments
router.get('/wallet', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const completedPayments = payments.filter((p: any) => p.status === 'COMPLETED');
    const totalSpent = completedPayments
      .filter((p: any) => p.amount > 0)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    const totalEarned = completedPayments
      .filter((p: any) => p.amount < 0)
      .reduce((sum: number, p: any) => sum + Math.abs(p.amount), 0);
    res.json({
      success: true,
      data: {
        balance: totalEarned - totalSpent,
        totalEarned,
        totalSpent,
        recentTransactions: payments.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
