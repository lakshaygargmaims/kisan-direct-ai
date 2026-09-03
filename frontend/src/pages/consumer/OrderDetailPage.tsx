import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder, useCancelOrder } from '../../hooks/queries';
import { useSocketEvent, useTrackOrder } from '../../hooks/useSocket';
import { ArrowLeft, CheckCircle, Clock, Truck, MapPin, Package, Bell } from 'lucide-react';

const STATUS_ORDER = [
  'PENDING_ADVANCE', 'ADVANCE_PAID', 'FARMER_ACCEPTED', 'PREPARING',
  'LOGISTICS_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'
];

const STATUS_ICONS: Record<string, any> = {
  PENDING_ADVANCE: Clock,
  ADVANCE_PAID: CheckCircle,
  FARMER_ACCEPTED: CheckCircle,
  PREPARING: Package,
  LOGISTICS_ASSIGNED: Truck,
  PICKED_UP: Truck,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle,
  COMPLETED: CheckCircle,
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [toast, setToast] = useState<string | null>(null);

  const { data: order, isLoading } = useOrder(id || '');
  const cancelMutation = useCancelOrder();

  // Join the order's tracking room for live updates
  useTrackOrder(id);

  useSocketEvent('order:status-changed', useCallback((data: any) => {
    if (data.orderId === id) {
      setToast(`🔄 Status updated: ${data.status.replace(/_/g, ' ')}`);
      setTimeout(() => setToast(null), 4000);
    }
  }, [id]));

  useSocketEvent('order:cancelled', useCallback((data: any) => {
    if (data.orderId === id) {
      setToast('❌ This order has been cancelled');
      setTimeout(() => setToast(null), 4000);
    }
  }, [id]));

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
      <Link to="/consumer/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${
            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {order.status?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Tracking Timeline */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Order Tracking</h3>
          <div className="space-y-0">
            {STATUS_ORDER.map((status, idx) => {
              const Icon = STATUS_ICONS[status] || Clock;
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const historyEntry = order.statusHistory?.find((h: any) => h.status === status);

              return (
                <div key={status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {idx < STATUS_ORDER.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status.replace(/_/g, ' ')}
                    </p>
                    {historyEntry && (
                      <p className="text-xs text-gray-400">{historyEntry.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Product</span><span>{order.product?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span>{order.quantity} kg</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price/{order.product?.unit || 'kg'}</span><span>₹{order.pricePerKg}</span></div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Amount</span><span>₹{Number(order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Advance (20%)</span><span className="text-green-600">₹{Number(order.advanceAmount).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Remaining</span><span>₹{Number(order.remainingAmount).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₹{Number(order.platformFee).toLocaleString()}</span></div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <p className="text-green-700">Farmer receives: ₹{(Number(order.totalAmount) * 0.85).toFixed(0)} (83%)</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Delivery to: {order.deliveryAddress}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Truck className="h-4 w-4" />
            <span>Farmer: {order.farmer?.name}</span>
          </div>
        </div>

        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <div className="mt-6 pt-4 border-t">
            <button onClick={() => {
              if (confirm('Are you sure you want to cancel this order?')) {
                cancelMutation.mutate({ id: order.id, reason: 'Cancelled by buyer' });
              }
            }} disabled={cancelMutation.isPending}
              className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50">
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
