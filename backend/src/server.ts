import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { config } from './config';
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
import { seedDemoAccounts } from './services/auth.service';
import { initSocket } from './utils/socket';

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'KisanDirect AI Backend',
    mode: config.isDemoMode() ? 'DEMO' : 'PRODUCTION',
    timestamp: new Date().toISOString(),
  });
});

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
