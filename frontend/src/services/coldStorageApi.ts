const BASE = '/api/cold-storage';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('kisan_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export interface Facility {
  id: string;
  name: string;
  operator?: string;
  city: string;
  address?: string;
  latitude: number;
  longitude: number;
  capacityKg: number;
  availableCapacityKg: number;
  storageType: string;
  tempMinC: number;
  tempMaxC: number;
  supportedCrops: string[];
  pricePerKgPerDay: number;
  minQuantityKg: number;
  maxDurationDays: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  contactPhone?: string;
  operatingHours?: string;
  rules?: string;
  distanceKm: number;
  isFull: boolean;
  capacityPercent: number;
}

export interface StorageQuote {
  productName: string;
  quantityKg: number;
  durationDays: number;
  ratePerKgPerDay: number;
  storageCost: number;
  platformFeePercent: number;
  platformFee: number;
  depositPercent: number;
  deposit: number;
  total: number;
  calculation: string;
}

export interface StoredBatch {
  id: string;
  batchCode: string;
  qrToken: string;
  productName: string;
  initialQtyKg: number;
  currentQtyKg: number;
  qualityGrade: string;
  storedAt: string;
  expectedEndDate: string;
  harvestDate?: string;
  tempRequired?: string;
  listedQtyKg: number;
  soldQtyKg: number;
  status: string;
  facility: { id: string; name: string; city: string };
  daysStored: number;
  daysRemaining: number;
  costAccrued: number;
  availableToSell: number;
  booking?: { ratePerKgPerDay: number };
  insight?: SellingInsight;
}

export interface SellingInsight {
  currentMarketPrice: number;
  estimatedPriceRange: { low: number; high: number };
  priceDataSource: string;
  sellNow: { quantityKg: number; grossRevenue: number; storageCost: number };
  wait15Days: { grossRevenueEstimate: number; extraStorageCost: number; estimatedNetGain: number };
  recommendation: string;
  confidence: number;
  disclaimer: string;
}

export const coldStorageApi = {
  getFacilities: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ facilities: Facility[]; total: number }>(`/facilities${qs}`);
  },
  getFacility: (id: string) => request<Facility>(`/facilities/${id}`),
  getQuote: (facilityId: string, body: { productName: string; quantityKg: number; durationDays: number }) =>
    request<StorageQuote>(`/facilities/${facilityId}/quote`, { method: 'POST', body: JSON.stringify(body) }),
  createBooking: (body: any) => request<{ booking: any; batch: any }>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getBookings: () => request<{ bookings: any[] }>('/bookings'),
  getPayments: () => request<{ payments: any[] }>('/payments'),
  getBatches: () => request<{ batches: StoredBatch[] }>('/batches'),
  getBatch: (id: string) => request<StoredBatch>(`/batches/${id}`),
  getAiInsight: (productName: string, quantityKg: number) =>
    request<SellingInsight>('/ai-insight', { method: 'POST', body: JSON.stringify({ productName, quantityKg }) }),
  sellFromBatch: (batchId: string, body: { quantityKg: number; pricePerKg: number }) =>
    request<any>(`/batches/${batchId}/sell`, { method: 'POST', body: JSON.stringify(body) }),
  extendStorage: (batchId: string, extraDays: number) =>
    request<any>(`/batches/${batchId}/extend`, { method: 'POST', body: JSON.stringify({ extraDays }) }),
  withdrawBatch: (batchId: string) =>
    request<any>(`/batches/${batchId}/withdraw`, { method: 'POST' }),
};
