import { Router, Request, Response } from 'express';
import { coldStorageService } from '../services/cold-storage.service';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// ─── Public: facility discovery ───
router.get('/facilities', (req: Request, res: Response) => {
  coldStorageService
    .getFacilities(req.query)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

router.get('/facilities/:id', (req: Request, res: Response) => {
  coldStorageService
    .getFacility(req.params.id)
    .then((facility) => {
      if (!facility) res.status(404).json({ success: false, error: 'Facility not found' });
      else res.json({ success: true, data: facility });
    })
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

/** Cost preview (no booking created) */
router.post('/facilities/:id/quote', (req: Request, res: Response) => {
  coldStorageService
    .quote(req.params.id, req.body)
    .then((quote) => res.json({ success: true, data: quote }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

// ─── Public-safe traceability (QR scan target) — must be before /batches/:id ───
router.get('/trace/:qrToken', (req: Request, res: Response) => {
  coldStorageService
    .getBatchByQrToken(req.params.qrToken)
    .then((data) => {
      if (!data) res.status(404).json({ success: false, error: 'Batch not found' });
      else res.json({ success: true, data });
    })
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

// ─── Farmer: bookings & payments ───
router.get('/bookings', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .getMyBookings(req.user!.userId)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

router.post('/bookings', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .createBooking(req.user!.userId, req.body)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

router.get('/payments', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .getMyPayments(req.user!.userId)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

// ─── Farmer: stored inventory ───
router.get('/batches', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .getMyBatches(req.user!.userId)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

router.get('/batches/:id', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .getBatch(req.user!.userId, req.params.id)
    .then((data) => {
      if (!data) res.status(404).json({ success: false, error: 'Batch not found' });
      else res.json({ success: true, data });
    })
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

/** AI Selling Insight — standalone (per product/quantity) */
router.post('/ai-insight', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .getSellingInsight(req.body.productName, req.body.quantityKg)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

/** List part of a batch for sale on the marketplace */
router.post('/batches/:id/sell', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .listBatchForSale(req.user!.userId, req.params.id, req.body)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

/** Extend storage duration (pays extra) */
router.post('/batches/:id/extend', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .extendStorage(req.user!.userId, req.params.id, req.body)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

/** Withdraw remaining product from storage (returns capacity) */
router.post('/batches/:id/withdraw', authenticate, authorize('FARMER', 'FPO'), (req: AuthRequest, res: Response) => {
  coldStorageService
    .withdrawBatch(req.user!.userId, req.params.id)
    .then((data) => res.json({ success: true, data }))
    .catch((e: any) => res.status(400).json({ success: false, error: e.message }));
});

export default router;
