import { useCallback } from 'react';
import { toast } from 'sonner';
import { useOrders, useUpdateOrderStatus, useCancelOrder } from '../../hooks/queries';
import { useSocketEvent } from '../../hooks/useSocket';
import { useTranslation } from 'react-i18next';
import { Package, Check, X, Truck } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING_ADVANCE: 'bg-yellow-100 text-yellow-700',
  ADVANCE_PAID: 'bg-blue-100 text-blue-700',
  FARMER_ACCEPTED: 'bg-indigo-100 text-indigo-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-700',
};

export default function FarmerOrders() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useOrders({ limit: '20' });
  const orders = data?.orders || [];

  const acceptMutation = useUpdateOrderStatus();
  const rejectMutation = useCancelOrder();

  useSocketEvent('order:created', useCallback((d: any) => {
    refetch();
    toast.success(`New order: ${d.productName || 'Product'} (${d.quantity}kg)`, { icon: '📦' });
  }, [refetch]));

  useSocketEvent('order:status-changed', useCallback(() => refetch(), [refetch]));
  useSocketEvent('order:cancelled', useCallback(() => refetch(), [refetch]));

  const acceptOrder = (id: string) => {
    acceptMutation.mutate(
      { id, status: 'FARMER_ACCEPTED', notes: 'Order accepted by farmer' },
      {
        onError: (err: any) => toast.error(err.message || 'Failed to accept order'),
      }
    );
  };

  const rejectOrder = (id: string) => {
    rejectMutation.mutate(
      { id, reason: 'Rejected by farmer' },
      {
        onSuccess: () => toast.success('Order rejected'),
        onError: (err: any) => toast.error(err.message || 'Failed to reject order'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('farmer.orders.title')}</h1>

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 animate-pulse"><div className="h-5 bg-gray-200 rounded w-1/3" /></div>
        ))}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{t('farmer.orders.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{order.product?.name} • {order.quantity} {order.product?.unit || 'kg'}</p>
                    <p className="text-sm text-gray-500">{order.buyer?.name} • ₹{Number(order.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                  {order.status === 'ADVANCE_PAID' && (
                    <div className="flex gap-2">
                      <button onClick={() => acceptOrder(order.id)} disabled={acceptMutation.isPending}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 disabled:opacity-50">
                        <Check className="h-4 w-4" /> {acceptMutation.isPending ? '...' : t('common.accept')}
                      </button>
                      <button onClick={() => rejectOrder(order.id)} disabled={rejectMutation.isPending}
                        className="border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-red-50 disabled:opacity-50">
                        <X className="h-4 w-4" /> {t('common.reject')}
                      </button>
                    </div>
                  )}
                  {order.status === 'FARMER_ACCEPTED' && (
                    <button className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700">
                      <Truck className="h-4 w-4" /> {t('farmer.orders.assignLogistics')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
