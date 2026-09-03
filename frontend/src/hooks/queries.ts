import { useQuery, useMutation, useQueryClient, QueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../services/api';

// ─── Query Keys ───────────────────────────────────────────────────

export const queryKeys = {
  products: (params?: Record<string, string>) => ['products', params] as const,
  product: (id: string) => ['product', id] as const,
  orders: (params?: Record<string, string>) => ['orders', params] as const,
  order: (id: string) => ['order', id] as const,
  notifications: (params?: Record<string, string>) => ['notifications', params] as const,
  clubbing: ['clubbing'] as const,
  mapFarmers: (params?: Record<string, string>) => ['map', 'farmers', params] as const,
  mapBuyers: ['map', 'buyers'] as const,
  mapHubs: ['map', 'hubs'] as const,
  mapDemand: ['map', 'demand'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminUsers: (params?: Record<string, string>) => ['admin', 'users', params] as const,
  adminDisputes: ['admin', 'disputes'] as const,
  adminPolicy: ['admin', 'cancellation-policy'] as const,
  settlements: ['payments', 'settlements'] as const,
};

// ─── Products ─────────────────────────────────────────────────────

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => api.getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ─── Orders ───────────────────────────────────────────────────────

export function useOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => api.getOrders(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => api.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Order placed successfully!');
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.updateOrderStatus(id, status, notes),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', variables.id] });
      toast.success('Order status updated');
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.cancelOrder(id, reason),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', variables.id] });
      toast.success('Order cancelled');
    },
  });
}

// ─── Payments ─────────────────────────────────────────────────────

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, amount }: { orderId: string; amount: number }) =>
      api.createPayment(orderId, amount),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', variables.orderId] });
      toast.success('Payment successful!');
    },
  });
}

// ─── Logistics / Clubbing ─────────────────────────────────────────

export function useClubbing() {
  return useQuery({
    queryKey: queryKeys.clubbing,
    queryFn: () => api.getClubbingOpportunities(),
  });
}

export function useAcceptClubbing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.acceptClubbing(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clubbing });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Orders clubbed successfully!');
    },
  });
}

export function useRejectClubbing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => api.rejectClubbing(routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clubbing });
      toast.success('Clubbing rejected');
    },
  });
}

// ─── Map ──────────────────────────────────────────────────────────

export function useMapFarmers(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.mapFarmers(params),
    queryFn: () => api.getMapFarmers(params),
  });
}

export function useMapBuyers() {
  return useQuery({
    queryKey: queryKeys.mapBuyers,
    queryFn: () => api.getMapBuyers(),
  });
}

export function useMapHubs() {
  return useQuery({
    queryKey: queryKeys.mapHubs,
    queryFn: () => api.getMapHubs(),
  });
}

export function useMapDemand() {
  return useQuery({
    queryKey: queryKeys.mapDemand,
    queryFn: () => api.getMapDemand(),
  });
}

// ─── Notifications ────────────────────────────────────────────────

export function useNotifications(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () => api.getNotifications(params),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ─── Admin ────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => api.getAdminDashboard(),
  });
}

export function useAdminUsers(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => api.getAdminUsers(params),
  });
}

export function useAdminDisputes() {
  return useQuery({
    queryKey: queryKeys.adminDisputes,
    queryFn: () => api.getDisputes(),
  });
}

export function useAdminPolicy() {
  return useQuery({
    queryKey: queryKeys.adminPolicy,
    queryFn: () => api.getCancellationPolicy(),
  });
}

// ─── Demand Heatmap ──────────────────────────────────────────────

export function useDemandHeatmap(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['demand', 'heatmap', params],
    queryFn: () => api.getDemandHeatmap(params),
  });
}

export function useDemandZones(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['demand', 'zones', params],
    queryFn: () => api.getDemandZones(params),
  });
}

export function useDemandProduct(productName: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: ['demand', 'product', productName, params],
    queryFn: () => api.getDemandProduct(productName, params),
    enabled: !!productName,
  });
}

export function useDemandNearby(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['demand', 'nearby', params],
    queryFn: () => api.getDemandNearby(params),
  });
}

export function useDemandRecommendation(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['demand', 'recommendation', params],
    queryFn: () => api.getDemandRecommendation(params),
    enabled: !!params?.product,
  });
}
