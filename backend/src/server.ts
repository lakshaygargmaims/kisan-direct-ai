import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { isOriginAllowed } from './utils/cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import logisticsRoutes from './routes/logistics.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import mapRoutes from './routes/map.routes';
import demandRoutes from './routes/demand.routes';
import harvestRoutes from './routes/harvest.routes';
import aiRoutes from './routes/ai.routes';
import globalTradeRoutes from './routes/global-trade.routes';
import { seedDemoAccounts } from './services/auth.service';
import { initSocket } from './utils/socket';

const app = express();
const httpServer = http.createServer(app);

// CORS — the API is same-origin with the UI in production (single service), but we
// still allow the configured FRONTEND_URL, *.railway.app / *.vercel.app previews,
// localhost dev origins, and CORS_ORIGINS so the API can be consumed separately.
// Same-origin requests (Origin matches the request Host) are always allowed.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || isOriginAllowed(origin, host)) {
    res.setHeader('Vary', 'Origin');
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }
  res.status(403).json({ success: false, error: 'Not allowed by CORS' });
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/harvests', harvestRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/global', globalTradeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'KisanDirect AI Backend',
    mode: config.isDemoMode() ? 'DEMO' : 'PRODUCTION',
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve the built frontend (single-service mode) ───────────────
// When a frontend build exists, the same Express server hosts the React app,
// so the whole product runs from ONE process and ONE URL. In development the
// Vite dev server (port 5173) proxies /api here, and this block is skipped.
const frontendDistCandidates = [
  process.env.FRONTEND_DIST,
  path.resolve(__dirname, '..', '..', 'frontend', 'dist'), // backend/dist → repo/frontend/dist
  path.resolve(process.cwd(), '..', 'frontend', 'dist'),
  path.resolve(process.cwd(), 'frontend', 'dist'),
].filter(Boolean) as string[];

const frontendDist = frontendDistCandidates.find((d) => fs.existsSync(path.join(d, 'index.html')));
if (frontendDist) {
  app.use(express.static(frontendDist));
  // SPA fallback: client-side routes (/marketplace, /dashboard, ...) return index.html
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
  console.log(`🖥️  Serving frontend from ${frontendDist}`);
} else {
  console.log('ℹ️  No frontend build found — API-only mode (use the Vite dev server in development).');
}

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    console.log('🌱 KisanDirect AI Backend starting...');
    console.log(`📦 Demo mode: ${config.isDemoMode() ? 'YES' : 'NO'}`);

    // Seed demo accounts
    try {
      await seedDemoAccounts();
      console.log('✅ Demo accounts ready');
    } catch (e: any) {
      console.log('⚠️  Demo account seeding skipped (DB may not be ready):', e.message);
    }

    // Initialize WebSocket server
    initSocket(httpServer);

    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`🔌 WebSocket ready on ws://localhost:${config.port}/socket.io`);
      console.log(`📋 API docs: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
