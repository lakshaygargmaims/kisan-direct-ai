import { useEffect, useRef, useCallback, createContext, useContext, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

// Resolve the Socket.IO server URL.
// 1. VITE_SOCKET_URL (only needed if the API lives on a different origin than the UI)
// 2. derive from VITE_API_URL when the frontend calls the backend directly
// 3. default: SAME ORIGIN — in the single-service deployment the Express server
//    serves the React app AND Socket.IO, so no cross-origin connection exists.
function resolveSocketUrl(): string {
  const explicit = (import.meta.env.VITE_SOCKET_URL || '').trim().replace(/\/+$/, '');
  if (explicit) return explicit;
  const apiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (apiUrl) return apiUrl;
  return ''; // same origin
}

const SOCKET_URL = resolveSocketUrl();

// ─── Context ──────────────────────────────────────────────────────

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function useSocketContext() {
  return useContext(SocketContext);
}

// ─── Provider ─────────────────────────────────────────────────────

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(SOCKET_URL || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
      // Register this socket with the server so we get targeted events
      socket.emit('register', { userId: user.id, role: user.role });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id, user?.role, token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

// ─── Hook: listen to a specific event ─────────────────────────────

/**
 * Subscribe to a socket event. Automatically cleans up on unmount.
 * The callback is stable — wrap in useCallback if it depends on changing state.
 *
 * @example
 * useSocketEvent('order:status-changed', (data) => {
 *   setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
 * });
 */
export function useSocketEvent<T = any>(
  eventName: string,
  handler: (data: T) => void,
) {
  const { socket } = useSocketContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const listener = (data: T) => handlerRef.current(data);
    socket.on(eventName, listener);

    return () => {
      socket.off(eventName, listener);
    };
  }, [socket, eventName]);
}

// ─── Hook: track a specific order ─────────────────────────────────

/**
 * Join an order's tracking room so you receive live status updates.
 */
export function useTrackOrder(orderId: string | undefined) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket || !orderId) return;
    socket.emit('track-order', { orderId });
    return () => {
      // Socket.IO automatically leaves rooms on disconnect,
      // but we can leave explicitly for cleanup
      socket.emit('track-order', { orderId: '' }); // no-op leave
    };
  }, [socket, orderId]);
}
