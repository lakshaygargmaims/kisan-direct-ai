const BASE = '/api/global';

const authHeaders = (): Record<string, string> => {
  // Same token key the rest of the app uses (see services/api.ts)
  const token = localStorage.getItem('kisan_token');
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
};

async function request(method: string, path: string, body?: any) {
  const headers: Record<string, string> = { ...authHeaders() };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const get = (path: string) => request('GET', path);
const post = (path: string, body?: any) => request('POST', path, body);

// ─── Products ─────────────────────────────────────────────────
export const getGlobalProducts = (filters?: Record<string, any>) => {
  const params = new URLSearchParams();
  if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  const qs = params.toString();
  return get(`/products${qs ? `?${qs}` : ''}`);
};

export const getGlobalProduct = (id: string) => get(`/products/${id}`);
export const createGlobalProduct = (data: any) => post('/products', data);
export const getMyGlobalProducts = () => get('/my-products');
export const deleteGlobalProduct = (id: string) => request('DELETE', `/products/${id}`);

// ─── Buyer Profile ────────────────────────────────────────────
export const getBuyerProfile = () => get('/buyer/profile');
export const upsertBuyerProfile = (data: any) => post('/buyer/profile', data);

// ─── RFQ ──────────────────────────────────────────────────────
export const createRFQ = (data: any) => post('/rfq', data);

export const getRFQs = (filters?: Record<string, any>) => {
  const params = new URLSearchParams();
  if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  const qs = params.toString();
  return get(`/rfq${qs ? `?${qs}` : ''}`);
};

export const getRFQ = (id: string) => get(`/rfq/${id}`);
export const getRFQMatches = (id: string) => get(`/rfq/${id}/matches`);
export const runMatching = (id: string) => post(`/rfq/${id}/match`);

// ─── Aggregation ──────────────────────────────────────────────
export const getAggregation = (rfqId: string) => get(`/rfq/${rfqId}/aggregation`);
export const runAggregation = (rfqId: string) => post(`/rfq/${rfqId}/aggregate`);

// ─── Offers ───────────────────────────────────────────────────
export const submitOffer = (rfqId: string, data: any) => post(`/rfq/${rfqId}/offer`, data);
export const acceptOffer = (offerId: string) => post(`/offers/${offerId}/accept`);

// ─── Shipping ─────────────────────────────────────────────────
export const getShippingEstimates = (rfqId: string) => get(`/rfq/${rfqId}/shipping`);

// ─── Eligibility ──────────────────────────────────────────────
export const checkEligibility = (productId: string, destination: string) =>
  get(`/eligibility?productId=${productId}&destination=${destination}`);
