import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Package, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getMyGlobalProducts, deleteGlobalProduct } from '../../services/globalTradeApi';

interface Listing {
  id: string;
  productName: string;
  category: string;
  originState: string;
  availableQuantity: number;
  unit: string;
  moq: number;
  expectedPrice: number;
  currency: string;
  exportStatus: string;
  coldChainRequired: boolean;
  isActive: boolean;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  EXPORT_ELIGIBLE: { label: 'Export Eligible', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  EXPORT_ELIGIBLE_WITH_VERIFICATION: { label: 'Verification Required', color: 'text-amber-700', bg: 'bg-amber-100' },
  EXPORT_POTENTIAL: { label: 'Export Potential', color: 'text-blue-700', bg: 'bg-blue-100' },
  DOMESTIC_DELIVERY: { label: 'Domestic Only', color: 'text-gray-700', bg: 'bg-gray-100' },
  LOCAL_ONLY: { label: 'Local Only', color: 'text-red-700', bg: 'bg-red-100' },
  INTERSTATE_DELIVERY: { label: 'Interstate', color: 'text-purple-700', bg: 'bg-purple-100' },
};

export default function GlobalListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await getMyGlobalProducts();
      const items = res?.data?.products || res?.products || [];
      setListings(Array.isArray(items) ? items : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (listing: Listing) => {
    if (!window.confirm(`Remove "${listing.productName}" from the Global Market?`)) return;
    setRemovingId(listing.id);
    try {
      await deleteGlobalProduct(listing.id);
      toast.success('Listing removed from Global Market');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove listing');
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
    return `₹${price}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">My Global Listings</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Products you offer to international bulk buyers</p>
        </div>
        <button
          onClick={() => navigate('/farmer/global-listings/add')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" />
          Add to Global Market
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No global listings yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">List your first product to reach international bulk buyers</p>
          <button
            onClick={() => navigate('/farmer/global-listings/add')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            List your first product
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => {
            const status = STATUS_MAP[listing.exportStatus] || STATUS_MAP.LOCAL_ONLY;
            return (
              <div key={listing.id} className={`bg-white rounded-xl border p-5 hover:shadow-md transition ${!listing.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => navigate(`/global/products/${listing.id}`)} className="text-left group flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{listing.productName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                      {!listing.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Removed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.originState}, India • {listing.category}
                      {listing.coldChainRequired && <span className="text-xs text-blue-600">• ❄️ Cold Chain</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => handleRemove(listing)}
                    disabled={removingId === listing.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Remove from Global Market"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="font-bold text-gray-900">{listing.availableQuantity.toLocaleString()} {listing.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">MOQ</p>
                    <p className="font-bold text-gray-900">{listing.moq.toLocaleString()} {listing.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Expected Price</p>
                    <p className="font-bold text-blue-700">{formatPrice(listing.expectedPrice)}/{listing.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Listed</p>
                    <p className="font-bold text-gray-900 text-sm">{new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>Export feasibility shown by the platform is an initial assessment and may require verification by authorized export, logistics, regulatory and compliance partners. All prices are reference data, not live quotes.</p>
      </div>
    </div>
  );
}