import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, Filter, Package, MapPin, ArrowRight, Star, Truck, Clock, Shield } from 'lucide-react';
import { getGlobalProducts } from '../../services/globalTradeApi';

interface GlobalProduct {
  id: string;
  productName: string;
  category: string;
  description?: string;
  originState: string;
  countryOfOrigin: string;
  availableQuantity: number;
  unit: string;
  moq: number;
  maxSupplyCapacity?: number;
  qualityGrade: string;
  expectedPrice: number;
  currency: string;
  packagingOptions?: string;
  shelfLife?: string;
  coldChainRequired: boolean;
  exportStatus: string;
  upcomingHarvest: boolean;
  advanceBooking: boolean;
  certifications?: string;
  user?: { name: string; email: string };
}

const EXPORT_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  EXPORT_ELIGIBLE: { label: 'Export Eligible', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  EXPORT_ELIGIBLE_WITH_VERIFICATION: { label: 'Verification Required', color: 'text-amber-700', bg: 'bg-amber-100' },
  EXPORT_POTENTIAL: { label: 'Potentially Feasible', color: 'text-blue-700', bg: 'bg-blue-100' },
  DOMESTIC_DELIVERY: { label: 'Domestic Only', color: 'text-gray-700', bg: 'bg-gray-100' },
  LOCAL_ONLY: { label: 'Local Only', color: 'text-red-700', bg: 'bg-red-100' },
  INTERSTATE_DELIVERY: { label: 'Interstate', color: 'text-purple-700', bg: 'bg-purple-100' },
};

const CATEGORIES = ['All', 'Grains', 'Spices', 'Fruits', 'Pulses', 'Dairy', 'Vegetables', 'Processed'];
const EXPORT_STATUSES = ['All', 'EXPORT_ELIGIBLE', 'EXPORT_ELIGIBLE_WITH_VERIFICATION', 'EXPORT_POTENTIAL'];
const INDIAN_STATES = ['All', 'Haryana', 'Punjab', 'Tamil Nadu', 'Maharashtra', 'Rajasthan', 'Kerala', 'Andhra Pradesh', 'Madhya Pradesh', 'Jammu & Kashmir'];

export default function GlobalMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<GlobalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await getGlobalProducts();
      const items = res?.data?.products || res?.products || [];
      setProducts(Array.isArray(items) ? items : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    if (searchQuery && !p.productName.toLowerCase().includes(searchQuery.toLowerCase()) && !p.originState.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && p.exportStatus !== selectedStatus) return false;
    if (selectedState !== 'All' && p.originState !== selectedState) return false;
    return true;
  });

  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
    return `₹${price}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-10 h-10 text-blue-300" />
            <h1 className="text-4xl font-bold">Global Bulk Export Marketplace</h1>
          </div>
          <p className="text-blue-200 text-lg mb-6 max-w-3xl">
            Indian Farms to Global Markets — Browse export-eligible agricultural products from verified Indian farmers and FPOs
          </p>
          <div className="flex gap-3 items-center text-sm text-blue-300">
            <Shield className="w-4 h-4" />
            <span>Demo / Simulated Data</span>
            <span className="text-blue-600">•</span>
            <span>All prices are reference data</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, states, farmers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Export Status</label>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="All">All Statuses</option>
                  {EXPORT_STATUSES.filter(s => s !== 'All').map(s => (
                    <option key={s} value={s}>{EXPORT_STATUS_MAP[s]?.label || s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Origin State</label>
                <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-700 hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{filtered.length}</span> products available for global trade
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/global/map')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <MapPin className="w-4 h-4" />
              Global Trade Map
            </button>
            <button
              onClick={() => navigate('/global/rfq/new')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
            >
              <Package className="w-4 h-4" />
              Create Bulk RFQ
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products match your filters</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(product => {
              const status = EXPORT_STATUS_MAP[product.exportStatus] || EXPORT_STATUS_MAP.LOCAL_ONLY;
              return (
                <div key={product.id} className="bg-white rounded-xl border hover:shadow-lg transition group">
                  {/* Header */}
                  <div className="p-5 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition text-lg">
                        {product.productName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{product.category} • Grade {product.qualityGrade}</p>
                    {product.coldChainRequired && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        ❄️ Cold Chain
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {product.originState}, {product.countryOfOrigin}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Available</p>
                        <p className="font-bold text-gray-900">{product.availableQuantity.toLocaleString()} {product.unit}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">MOQ</p>
                        <p className="font-bold text-gray-900">{product.moq.toLocaleString()} {product.unit}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Expected Price</p>
                        <p className="font-bold text-blue-700 text-lg">{formatPrice(product.expectedPrice)}/{product.unit}</p>
                      </div>
                      {product.upcomingHarvest && (
                        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Upcoming Harvest
                        </span>
                      )}
                    </div>

                    {product.packagingOptions && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Truck className="w-3 h-3" />
                        {product.packagingOptions}
                      </div>
                    )}

                    {product.user && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Star className="w-3 h-3" />
                        Seller: {product.user.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex gap-2">
                    <button
                      onClick={() => navigate(`/global/products/${product.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/global/rfq/new?product=${product.id}&name=${encodeURIComponent(product.productName)}&qty=${product.moq}`)}
                      className="px-4 py-2.5 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 text-sm font-medium transition"
                    >
                      Request Quote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>Disclaimer:</strong> Export feasibility shown by the platform is an initial assessment and may require verification by authorized export, logistics, regulatory and compliance partners. All prices shown are reference data, not live market quotes.
        </div>
      </div>
    </div>
  );
}
