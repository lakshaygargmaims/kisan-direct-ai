import { useState } from 'react';
import { toast } from 'sonner';
import { useClubbing, useAcceptClubbing, useRejectClubbing } from '../../hooks/queries';
import { TrendingUp, CheckCircle, X, RefreshCw } from 'lucide-react';

export default function OrderClubbing() {
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: clubs, isLoading, refetch } = useClubbing();
  const acceptMutation = useAcceptClubbing();
  const rejectMutation = useRejectClubbing();

  const acceptClub = (club: any) => {
    setAccepting(club.routeId);
    acceptMutation.mutate(
      {
        routeId: club.routeId,
        orders: club.orders.map((o: any) => ({ orderId: o.orderId })),
        totalQuantity: club.totalQuantity,
        vehicleType: club.vehicleType,
        totalDistance: club.totalDistance,
        estimatedTime: club.estimatedTime,
        separateCost: club.separateCost,
        clubbedCost: club.clubbedCost,
        savings: club.savings,
      },
      {
        onSettled: () => setAccepting(null),
        onError: (err: any) => toast.error('Failed to accept: ' + (err.message || 'Unknown error')),
      }
    );
  };

  const rejectClub = (routeId: string) => {
    rejectMutation.mutate(routeId, {
      onError: (err: any) => toast.error('Failed to reject: ' + (err.message || 'Unknown error')),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            AI Order Clubbing
          </h1>
          <p className="text-gray-500">Save on logistics by grouping compatible nearby orders</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, j) => <div key={j} className="h-14 bg-gray-100 rounded-lg" />)}
                </div>
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, j) => <div key={j} className="h-5 bg-gray-100 rounded" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !clubs || clubs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <CheckCircle className="h-16 w-16 mx-auto text-green-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No clubbing opportunities right now</h3>
          <p className="text-sm text-gray-400 mt-1">
            You need at least 2 orders in ADVANCE_PAID or FARMER_ACCEPTED status from nearby buyers.
          </p>
          <button onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
            Check Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {clubs.map((club: any) => (
            <div key={club.routeId} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      🚛 {club.orders.length} Orders Can Be Clubbed
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {club.totalQuantity} kg total • {club.vehicleType?.replace(/_/g, ' ')} ({club.vehicleCapacity} kg capacity)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">You save</p>
                    <p className="text-3xl font-bold text-green-600">₹{club.savings}</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-3">COMPATIBLE ORDERS</h3>
                    <div className="space-y-2">
                      {club.orders.map((order: any) => (
                        <div key={order.orderId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                            {order.orderId.slice(-4)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{order.buyerName || 'Buyer'}</p>
                            <p className="text-xs text-gray-400">
                              {order.buyerCity || 'Location'} • {Math.round(order.distanceFromFarmer)} km
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium">{order.quantity} kg</span>
                            <p className="text-xs text-gray-400">₹{Number(order.totalAmount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-3">OPTIMIZED ROUTE</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Your Farm (Start)</span>
                      </div>
                      {club.optimizedSequence?.map((stop: any, i: number) => {
                        const order = club.orders?.find((o: any) => o.orderId === stop.orderId);
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>Stop {i + 1}: {order?.buyerName || stop.orderId.slice(-4)} — {Math.round(order?.distanceFromFarmer || 0)} km</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total distance</span>
                        <span>{club.totalDistance} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimated time</span>
                        <span>{club.estimatedTime} min</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Separate deliveries</span>
                          <span className="line-through text-red-500">₹{club.separateCost}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Clubbed delivery</span>
                          <span className="text-green-600">₹{club.clubbedCost}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t">
                  <button
                    onClick={() => acceptClub(club)}
                    disabled={acceptMutation.isPending || accepting === club.routeId}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle className="h-5 w-5" />
                    {accepting === club.routeId ? 'Accepting...' : `Club Orders (Save ₹${club.savings})`}
                  </button>
                  <button onClick={() => rejectClub(club.routeId)} disabled={rejectMutation.isPending}
                    className="px-4 py-3 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1 disabled:opacity-50">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
