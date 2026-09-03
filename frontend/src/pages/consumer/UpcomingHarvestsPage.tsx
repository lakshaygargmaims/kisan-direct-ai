import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';
import {
  Sprout, Calendar, MapPin, Package, Star, Leaf, Clock,
  CheckCircle2, Truck, AlertTriangle, Loader2, Filter, X, Brain, Shield
} from 'lucide-react';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

const CONSUMER = { lat: 28.5245, lng: 77.2066 };

const CATEGORY_ICONS: Record<string, string> = {
  Vegetables: '🥬', Fruits: '🍎', Grains: '🌾', Pulses: '🫘',
  Spices: '🌶️', Dairy: '🥛', Processed: '📦', Other: '🌿',
};

export default function UpcomingHarvestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [category, setCategory] = useState('');
  const [showReserveModal, setShowReserveModal] = useState<any>(null);
  const [reserveQty, setReserveQty] = useState('');
  const [reserveAddr, setReserveAddr] = useState<string>('');
  const [reserving, setReserving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['harvests', 'upcoming', category],
    queryFn: () => api.getHarvests({ upcoming: 'true', ...(category ? { category } : {}), limit: '50' }),
  });

  const harvests = (data?.harvests || []).map((h: any) => ({
    ...h,
    distance: haversineDistance(CONSUMER.lat, CONSUMER.lng, h.farmLatitude, h.farmLongitude),
  })).sort((a: any, b: any) => a.distance - b.distance);

  const reserveMutation = useMutation({
    mutationFn: (data: any) => api.reserveHarvest(showReserveModal.id, data),
    onSuccess: () => {
      toast.success('Reservation confirmed! Advance payment processed.');
      setShowReserveModal(null);
      setReserveQty('');
      qc.invalidateQueries({ queryKey: ['harvests'] });
    },
    onError: (err: any) => toast.error(err.message || 'Reservation failed'),
  });

  const handleReserve = () => {
    if (!reserveQty || !reserveAddr || !showReserveModal) return;
    const qty = Number(reserveQty);
    if (qty < showReserveModal.minBookingQuantity) {
      toast.error(`Minimum booking is ${showReserveModal.minBookingQuantity} ${showReserveModal.unit}`);
      return;
    }
    reserveMutation.mutate({
      quantity: qty,
      deliveryAddress: reserveAddr,
      deliveryLatitude: CONSUMER.lat + (Math.random() - 0.5) * 0.01,
      deliveryLongitude: CONSUMER.lng + (Math.random() - 0.5) * 0.01,
      acknowledged: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sprout className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">🌱 Upcoming Harvests</h1>
            <p className="text-green-100">Reserve fresh produce before harvest — secure your supply</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-green-100">
          <Shield className="h-4 w-4" />
          <span>All advance payments are protected. Actual quantity may vary at harvest.</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
            !category ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          All ({data?.total || 0})
        </button>
        {Object.entries(CATEGORY_ICONS).map(([cat, emoji]) => (
          <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              category === cat ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {emoji} {cat}
          </button>
        ))}
      </div>

      {/* Harvest Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : harvests.length === 0 ? (
        <div className="text-center py-12">
          <Sprout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No upcoming harvests available</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon for new harvest listings</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {harvests.map((harvest: any) => {
            const remaining = harvest.expectedQuantity - harvest.totalReservedQuantity;
            const reservedPct = harvest.expectedQuantity > 0
              ? Math.round((harvest.totalReservedQuantity / harvest.expectedQuantity) * 100) : 0;
            const daysLeft = Math.ceil((new Date(harvest.expectedHarvestDate).getTime() - Date.now()) / 86400000);

            return (
              <div key={harvest.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition">
                {/* Header Badge */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-xs font-bold tracking-wide">🌱 UPCOMING HARVEST</span>
                  <span className="text-green-100 text-xs">
                    {daysLeft > 0 ? `In ${daysLeft} days` : daysLeft === 0 ? 'Today!' : 'Overdue'}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{harvest.productName}</h3>
                      <p className="text-sm text-gray-500">{harvest.farmer?.name} • Verified Farmer</p>
                    </div>
                    <span className="text-2xl">{CATEGORY_ICONS[harvest.category?.name] || '🌿'}</span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Expected Harvest</span>
                      <span className="font-medium">{new Date(harvest.expectedHarvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Expected Price</span>
                      <span className="font-bold text-green-700">₹{harvest.expectedPricePerUnit}/{harvest.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available for Booking</span>
                      <span className="font-medium text-blue-600">{remaining} {harvest.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Distance</span>
                      <span className="font-medium">{harvest.distance} km</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{reservedPct}% Reserved</span>
                      <span>{harvest.totalReservedQuantity}/{harvest.expectedQuantity} {harvest.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${reservedPct}%` }} />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {harvest.coldChainRequired && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">❄️ Cold Chain</span>
                    )}
                    {harvest.advanceBookingEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Advance {harvest.advancePercentage}%</span>
                    )}
                    {harvest.deliveryType === 'INTERSTATE' && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">Interstate</span>
                    )}
                    {harvest.actualHarvestedQuantity !== null && harvest.actualHarvestedQuantity !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">✅ Confirmed</span>
                    )}
                  </div>

                  {/* Reserve Button */}
                  {remaining > 0 && harvest.status === 'BOOKING_OPEN' && (
                    <button onClick={() => { setShowReserveModal(harvest); setReserveAddr('South Delhi, NCR'); }}
                      className="w-full mt-4 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
                      <Sprout className="h-4 w-4" /> RESERVE NOW
                    </button>
                  )}
                  {remaining <= 0 && (
                    <div className="w-full mt-4 bg-gray-100 text-gray-500 py-2.5 rounded-lg font-medium text-center">
                      Fully Reserved
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reserve Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Reserve {showReserveModal.productName}</h2>
                <button onClick={() => setShowReserveModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
                <p className="text-green-800">🌱 This product is expected to be harvested on {new Date(showReserveModal.expectedHarvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Actual quantity, quality and availability may vary.</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Reservation Quantity *</span>
                  <input type="number" value={reserveQty} onChange={e => setReserveQty(e.target.value)}
                    min={showReserveModal.minBookingQuantity}
                    max={showReserveModal.expectedQuantity - showReserveModal.totalReservedQuantity}
                    placeholder={`Min: ${showReserveModal.minBookingQuantity}`}
                    className="w-24 text-right border rounded px-2 py-1" />
                </div>
                {reserveQty && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Expected Price</span>
                      <span>₹{showReserveModal.expectedPricePerUnit}/{showReserveModal.unit}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Estimated Product Value</span>
                      <span className="font-medium">₹{(Number(reserveQty) * showReserveModal.expectedPricePerUnit).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Advance ({showReserveModal.advancePercentage}%)</span>
                      <span className="font-bold text-green-700">
                        ₹{Math.round(Number(reserveQty) * showReserveModal.expectedPricePerUnit * showReserveModal.advancePercentage / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-500">Remaining (payable at harvest)</span>
                      <span>₹{Math.round(Number(reserveQty) * showReserveModal.expectedPricePerUnit * (1 - showReserveModal.advancePercentage / 100)).toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="py-2">
                  <label className="text-gray-500 block mb-1">Delivery Address *</label>
                  <input type="text" value={reserveAddr} onChange={e => setReserveAddr(e.target.value)}
                    placeholder="Enter delivery address" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                ⚠️ Advance payment is non-refundable if you cancel after harvest confirmation. Platform policy applies.
              </div>

              <button onClick={handleReserve} disabled={!reserveQty || !reserveAddr || reserving}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {reserving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {reserving ? 'Processing...' : 'Confirm Reservation & Pay Advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
