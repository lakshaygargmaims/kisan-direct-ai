import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: UserRole; phone?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const API_BASE = '/api';

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) throw new Error('Server returned an empty response. Is the backend running?');
  try { return JSON.parse(text); } catch { throw new Error('Invalid response from server. Is the backend running?'); }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('kisan_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok && res.status === 0) throw new Error('Cannot connect to server. Is the backend running?');
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.error);
      localStorage.setItem('kisan_token', data.data.token);
      set({ user: data.data.user, token: data.data.token, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (regData) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
      if (!res.ok && res.status === 0) throw new Error('Cannot connect to server. Is the backend running?');
      const data = await safeJson(res);
      if (!data.success) throw new Error(data.error);
      localStorage.setItem('kisan_token', data.data.token);
      set({ user: data.data.user, token: data.data.token, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('kisan_token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (data.success) {
        set({ user: data.data, isLoading: false });
      } else {
        localStorage.removeItem('kisan_token');
        set({ user: null, token: null, isLoading: false });
      }
    } catch {
      localStorage.removeItem('kisan_token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    CONSUMER: '/consumer/dashboard',
    FARMER: '/farmer/dashboard',
    FPO: '/farmer/dashboard',
    B2B_BUYER: '/buyer/dashboard',
    LOGISTICS: '/logistics/dashboard',
    ADMIN: '/admin/dashboard',
  };
  return paths[role] || '/';
}

export function getApiHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
