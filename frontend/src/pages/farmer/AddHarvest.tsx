import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';
import { Sprout, ArrowLeft, Loader2, MapPin, Calendar, Package, DollarSign, Truck, Info } from 'lucide-react';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy', 'Processed', 'Other'];

export default function AddHarvest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: '', description: '', category: 'Vegetables',
    expectedHarvestDate: '', expectedQuantity: '', unit: 'kg',
    qualityGrade: 'A', expectedPricePerUnit: '',
    minBookingQuantity: '10', maxBookingPerBuyer: '',
    farmLatitude: user ? '28.6139' : '28.6139',
    farmLongitude: user ? '77.2090' : '77.2090',
    farmAddress: '', deliveryRadiusKm: '50',
    deliveryType: 'LOCAL', coldChainRequired: false,
    advanceBookingEnabled: true, advancePercentage: '20',
    bookingOpenDate: '', bookingCloseDate: '', notes: '',
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.expectedHarvestDate || !form.expectedQuantity || !form.expectedPricePerUnit) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const data = await api.createHarvest({
        ...form,
        expectedQuantity: Number(form.expectedQuantity),
        expectedPricePerUnit: Number(form.expectedPricePerUnit),
        minBookingQuantity: Number(form.minBookingQuantity),
        maxBookingPerBuyer: form.maxBookingPerBuyer ? Number(form.maxBookingPerBuyer) : undefined,
        farmLatitude: Number(form.farmLatitude),
        farmLongitude: Number(form.farmLongitude),
        deliveryRadiusKm: Number(form.deliveryRadiusKm),
        advancePercentage: Number(form.advancePercentage),
        bookingOpenDate: form.bookingOpenDate || undefined,
        bookingCloseDate: form.bookingCloseDate || undefined,
      });
      toast.success('Upcoming harvest listed successfully!');
      navigate('/farmer/harvests');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create harvest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" /> Add Upcoming Harvest
          </h1>
          <p className="text-gray-500">List your expected harvest for advance booking</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <div className="text-sm text-green-800">
          <p className="font-medium">About Upcoming Harvests</p>
          <p className="mt-1">List your expected harvest before it's ready. Buyers can reserve and pay an advance.
          This is NOT confirmed inventory — actual quantity may vary at harvest time.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Package className="h-4 w-4" /> Product Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop/Product Name *</label>
              <input type="text" value={form.productName} onChange={e => set('productName', e.target.value)}
                placeholder="e.g., Tomato, Wheat, Mango"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Describe your expected harvest quality, variety, farming method..."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
              <select value={form.qualityGrade} onChange={e => set('qualityGrade', e.target.value)}
                className="w-full border rounded-lg px-3 py-2">
                {['A', 'A+', 'B', 'B+', 'C'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)}
                className="w-full border rounded-lg px-3 py-2">
                {['kg', 'L', 'pieces', 'dozen', 'quintal'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.coldChainRequired} onChange={e => set('coldChainRequired', e.target.checked)}
                  className="rounded border-gray-300 text-green-600" />
                ❄️ Cold Chain Required
              </label>
            </div>
          </div>
        </div>

        {/* Harvest Details */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Harvest Details</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest Date *</label>
              <input type="date" value={form.expectedHarvestDate} onChange={e => set('expectedHarvestDate', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Quantity *</label>
              <input type="number" value={form.expectedQuantity} onChange={e => set('expectedQuantity', e.target.value)}
                placeholder="e.g., 1000" className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Price (₹/unit) *</label>
              <input type="number" step="0.5" value={form.expectedPricePerUnit} onChange={e => set('expectedPricePerUnit', e.target.value)}
                placeholder="e.g., 30" className="w-full border rounded-lg px-3 py-2" required />
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Booking Settings</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Booking Quantity</label>
              <input type="number" value={form.minBookingQuantity} onChange={e => set('minBookingQuantity', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Per Buyer</label>
              <input type="number" value={form.maxBookingPerBuyer} onChange={e => set('maxBookingPerBuyer', e.target.value)}
                placeholder="No limit" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance %</label>
              <input type="number" min="5" max="100" value={form.advancePercentage} onChange={e => set('advancePercentage', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Opens</label>
              <input type="date" value={form.bookingOpenDate} onChange={e => set('bookingOpenDate', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Closes</label>
              <input type="date" value={form.bookingCloseDate} onChange={e => set('bookingCloseDate', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>

        {/* Location & Delivery */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Truck className="h-4 w-4" /> Location & Delivery</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Latitude</label>
              <input type="number" step="0.0001" value={form.farmLatitude} onChange={e => set('farmLatitude', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Longitude</label>
              <input type="number" step="0.0001" value={form.farmLongitude} onChange={e => set('farmLongitude', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
              <input type="number" value={form.deliveryRadiusKm} onChange={e => set('deliveryRadiusKm', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
              <select value={form.deliveryType} onChange={e => set('deliveryType', e.target.value)}
                className="w-full border rounded-lg px-3 py-2">
                <option value="LOCAL">Local Delivery</option>
                <option value="INTERSTATE">State-to-State Delivery</option>
                <option value="PICKUP">Pickup Available</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Address</label>
              <input type="text" value={form.farmAddress} onChange={e => set('farmAddress', e.target.value)}
                placeholder="Village, District, State" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder="Any additional information about the harvest..."
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500" />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-4 w-4" />}
            {loading ? 'Creating...' : 'List Upcoming Harvest'}
          </button>
        </div>
      </form>
    </div>
  );
}
