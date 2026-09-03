const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('kisan_token');
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) throw new Error('Server returned an empty response');
  try { return JSON.parse(text); } catch { throw new Error('Invalid server response'); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok && res.status === 0) throw new Error('Cannot connect to server');
  const data = await safeJson(res);
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Don't set Content-Type for FormData - browser sets it with boundary
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok && res.status === 0) throw new Error('Cannot connect to server');
  const data = await safeJson(res);
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return data.data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Products
  getProducts: (params?: Record<string, string>) =>
    request<any>(`/products${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadProductImages: (productId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return uploadRequest<any[]>(`/products/${productId}/images`, formData);
  },
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
  deleteProductImage: (productId: string, imageId: string) =>
    request<any>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params?: Record<string, string>) =>
    request<any>(`/orders${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getOrder: (id: string) => request<any>(`/orders/${id}`),
  cancelOrder: (id: string, reason: string) =>
    request<any>(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  updateOrderStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),

  // Payments
  createPayment: (orderId: string, amount: number) =>
    request<any>('/payments/create', { method: 'POST', body: JSON.stringify({ orderId, amount }) }),
  getSettlements: () => request<any>('/payments/settlements'),

  // Logistics
  getDeliveryQuote: (data: any) =>
    request<any>('/logistics/quote', { method: 'POST', body: JSON.stringify(data) }),
  createDelivery: (data: any) =>
    request<any>('/logistics/create', { method: 'POST', body: JSON.stringify(data) }),
  getClubbingOpportunities: () => request<any>('/logistics/clubbing'),
  acceptClubbing: (data: any) => request<any>('/logistics/clubbing/accept', { method: 'POST', body: JSON.stringify(data) }),
  rejectClubbing: (routeId: string) => request<any>(`/logistics/clubbing/${routeId}/reject`, { method: 'POST' }),

  // Map
  getMapFarmers: (params?: Record<string, string>) =>
    request<any>(`/map/farmers${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getMapBuyers: () => request<any>('/map/buyers'),
  getMapHubs: () => request<any>('/map/hubs'),
  getMapDemand: () => request<any>('/map/demand'),

  // Notifications
  getNotifications: (params?: Record<string, string>) =>
    request<any>(`/notifications${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),

  // Admin
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getAdminAnalytics: () => request<any>('/admin/analytics'),
  getAdminUsers: (params?: Record<string, string>) =>
    request<any>(`/admin/users${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getDisputes: () => request<any>('/admin/disputes'),
  getCancellationPolicy: () => request<any>('/admin/cancellation-policy'),

  // Harvest Reserve
  getHarvests: (params?: Record<string, string>) =>
    request<any>(`/harvests${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getHarvest: (id: string) => request<any>(`/harvests/${id}`),
  createHarvest: (data: any) => request<any>('/harvests', { method: 'POST', body: JSON.stringify(data) }),
  updateHarvest: (id: string, data: any) => request<any>(`/harvests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHarvest: (id: string) => request<any>(`/harvests/${id}`, { method: 'DELETE' }),
  reserveHarvest: (id: string, data: any) => request<any>(`/harvests/${id}/reserve`, { method: 'POST', body: JSON.stringify(data) }),
  getHarvestReservations: (id: string) => request<any>(`/harvests/${id}/reservations`),
  confirmHarvest: (id: string, data: any) => request<any>(`/harvests/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) }),
  updateHarvestDate: (id: string, data: any) => request<any>(`/harvests/${id}/update-date`, { method: 'POST', body: JSON.stringify(data) }),
  getHarvestMatches: (id: string) => request<any>(`/harvests/${id}/matches`),
  getHarvestAI: (id: string) => request<any>(`/harvests/${id}/ai-recommendation`),
  getMyReservations: () => request<any>('/harvests/my/reservations'),

  // AI
  getFairPrice: (data: any) =>
    request<any>('/ai/fair-price/predict', { method: 'POST', body: JSON.stringify(data) }),

  getDemandForecast: (data: any) =>
    request<any>('/ai/demand-forecast/predict', { method: 'POST', body: JSON.stringify(data) }),

  getFarmerRecommendations: (data: any) =>
    request<any>('/ai/farmer-recommendation/rank', { method: 'POST', body: JSON.stringify(data) }),

  // Demand Heatmap
  getDemandHeatmap: (params?: Record<string, string>) =>
    request<any>(`/demand/heatmap${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getDemandZones: (params?: Record<string, string>) =>
    request<any>(`/demand/zones${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getDemandProduct: (productName: string, params?: Record<string, string>) =>
    request<any>(`/demand/product/${encodeURIComponent(productName)}${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getDemandNearby: (params?: Record<string, string>) =>
    request<any>(`/demand/nearby${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getDemandRecommendation: (params?: Record<string, string>) =>
    request<any>(`/demand/recommendation${params ? '?' + new URLSearchParams(params).toString() : ''}`),
};
