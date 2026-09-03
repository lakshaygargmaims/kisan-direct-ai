import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/queries';
import { Package } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING_ADVANCE: 'bg-yellow-100 text-yellow-700',
  ADVANCE_PAID: 'bg-blue-100 text-blue-700',
  FARMER_ACCEPTED: 'bg-indigo-100 text-indigo-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  LOGISTICS_ASSIGNED: 'bg-cyan-100 text-cyan-700',
  PICKED_UP: 'bg-teal-100 text-teal-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading } = useOrders({ limit: '20' });
  const orders = data?.orders || [];

  const filtered = filter === 'all' ? orders : orders.filter((o: any) => o.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-gray-500">Track and manage your orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'PENDING_ADVANCE', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => (
            <Link key={order.id} to={`/consumer/orders/${order.id}`}
              className="block bg-white rounded-xl border p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{order.product?.name || 'Product'}</p>
                    <p className="text-sm text-gray-500">
                      {order.quantity} kg • ₹{Number(order.totalAmount).toLocaleString()} • Farmer: {order.farmer?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
