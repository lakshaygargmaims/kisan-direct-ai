import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

/**
 * Initialize the Socket.IO server attached to an HTTP server.
 * Call this once from server.ts after creating the Express app.
 */
export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Clients join rooms based on their role and userId
    // The client sends a 'register' event with { userId, role }
    socket.on('register', ({ userId, role }: { userId: string; role: string }) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
      if (role) {
        socket.join(`role:${role}`);
      }
      console.log(`  📎 Socket ${socket.id} registered as ${role} (${userId?.slice(-8)})`);
    });

    // Clients can join order-specific rooms for live tracking
    socket.on('track-order', ({ orderId }: { orderId: string }) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`  📡 Socket ${socket.id} tracking order ${orderId.slice(-8)}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance.
 * Throws if initSocket() hasn't been called yet.
 */
export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket() first');
  return io;
}

// ─── Helper emitters ──────────────────────────────────────────────

export interface OrderEvent {
  orderId: string;
  status: string;
  farmerId: string;
  buyerId: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  timestamp: string;
}

/** Broadcast when a new order is placed */
export function emitOrderCreated(event: OrderEvent) {
  getIO().to(`user:${event.farmerId}`).emit('order:created', event);
  getIO().to(`user:${event.buyerId}`).emit('order:created', event);
}

/** Broadcast when order status changes (accepted, preparing, shipped, etc.) */
export function emitOrderStatusChanged(event: OrderEvent) {
  getIO().to(`user:${event.farmerId}`).emit('order:status-changed', event);
  getIO().to(`user:${event.buyerId}`).emit('order:status-changed', event);
  getIO().to(`order:${event.orderId}`).emit('order:status-changed', event);
}

/** Broadcast when an order is cancelled */
export function emitOrderCancelled(event: OrderEvent) {
  getIO().to(`user:${event.farmerId}`).emit('order:cancelled', event);
  getIO().to(`user:${event.buyerId}`).emit('order:cancelled', event);
  getIO().to(`order:${event.orderId}`).emit('order:cancelled', event);
}

/** Broadcast when payment is received */
export function emitPaymentReceived(event: OrderEvent & { amount: number }) {
  getIO().to(`user:${event.farmerId}`).emit('payment:received', event);
  getIO().to(`user:${event.buyerId}`).emit('payment:received', event);
}

/** Broadcast when clubbing is accepted */
export function emitClubbingAccepted(event: { clubId: string; farmerId: string; orders: string[]; savings: number }) {
  getIO().to(`role:FARMER`).emit('clubbing:accepted', event);
}
