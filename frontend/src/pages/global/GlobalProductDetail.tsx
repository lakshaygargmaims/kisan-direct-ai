import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Globe, MapPin, Package, ArrowLeft, ArrowRight, Truck, Clock, Shield,
  Snowflake, Award, FileText, AlertTriangle, Search, Loader2,
} from 'lucide-react';
import { getGlobalProduct, checkEligibility } from '../../services/globalTradeApi';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  EXPORT_ELIGIBLE: { label: 'Export Eligible', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  EXPORT_ELIGIBLE_WITH_VERIFICATION: { label: 'Verification Required', color: 'text-amber-700', bg: 'bg-amber-100' },
  EXPORT_POTENTIAL: { label: 'Potentially Feasible', color: 'text-blue-700', bg: 'bg-blue-100' },
  DOMESTIC_DELIVERY: { label: 'Domestic Only', color: 'text-gray-700', bg: 'bg-gray-100' },
  LOCAL_ONLY: { label: 'Local Only', color: 'text-red-700', bg: 'bg-red-100' },
  INTERSTATE_DELIVERY: { label: 'Interstate', color: 'text-purple-700', bg: 'bg-purple-100' },
};

const DESTINATIONS = ['UAE', 'Singapore', 'Malaysia', 'Germany', 'UK', 'USA', 'Canada', 'Japan', 'Australia', 'Nepal', 'Bangladesh', 'Sri Lanka'];

export default function GlobalProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [destination, setDestination] = useState('UAE');
  const [eligibility, setEligibility] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getGlobalProduct(id!);
        setProduct(res?.data || null);
        if (!res?.data) setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const runEligibilityCheck = async () => {
    setChecking(true);
    setEligibility(null);
    try {
      const res = await checkEligibility(id!, destination);
      setEligibility(res?.data || null);
    } catch (err: any) {
      setEligibility({ status: '⚠️ Check Failed', feasible: false, reasons: [err.message || 'Unable to check eligibility'] });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl border p-12 max-w-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-500 text-sm mb-6">This global listing may have been removed by the seller.</p>
          <Link to="/global/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_MAP[product.exportStatus] || STATUS_MAP.LOCAL_ONLY;
  const currencySymbol = product.currency === 'INR' ? '₹' : `${product.currency} `;
  const formatQty = (n: number) => n.toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Link to="/global/marketplace" className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Global Marketplace
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold">{product.productName}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>{status.label}</span>
            {product.coldChainRequired && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-200">
                <Snowflake className="h-3 w-3" /> Cold Chain
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-blue-200 text-sm">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {product.originState}, {product.countryOfOrigin}</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-4 w-4" /> {product.category}</span>
            {product.upcomingHarvest && (
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> Upcoming Harvest</span>
            )}
            <span className="inline-flex items-center gap-1"><Shield className="h-4 w-4" /> Demo / Simulated Data</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500">Available Quantity</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatQty(product.availableQuantity)} <span className="text-sm font-medium text-gray-500">{product.unit}</span></p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500">MOQ</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatQty(product.moq)} <span className="text-sm font-medium text-gray-500">{product.unit}</span></p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500">Expected Price</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{currencySymbol}{formatQty(product.expectedPrice)}<span className="text-sm font-medium text-gray-500">/{product.unit}</span></p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500">Quality Grade</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{product.qualityGrade}</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold text-gray-900 mb-2">About this product</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Logistics & export details */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Export & Logistics Details</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {product.packagingOptions && (
                  <div className="flex items-center gap-2 text-gray-600"><Truck className="h-4 w-4 text-gray-400 flex-shrink-0" /> Packaging: <strong className="text-gray-900">{product.packagingOptions}</strong></div>
                )}
                {product.shelfLife && (
                  <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-gray-400 flex-shrink-0" /> Shelf Life: <strong className="text-gray-900">{product.shelfLife}</strong></div>
                )}
                {product.storageRequirement && (
                  <div className="flex items-center gap-2 text-gray-600"><FileText className="h-4 w-4 text-gray-400 flex-shrink-0" /> Storage: <strong className="text-gray-900">{product.storageRequirement}</strong></div>
                )}
                {product.maxSupplyCapacity != null && (
                  <div className="flex items-center gap-2 text-gray-600"><Package className="h-4 w-4 text-gray-400 flex-shrink-0" /> Max Capacity: <strong className="text-gray-900">{formatQty(product.maxSupplyCapacity)} {product.unit}</strong></div>
                )}
                {product.harvestDate && (
                  <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-gray-400 flex-shrink-0" /> Harvest Date: <strong className="text-gray-900">{product.harvestDate}</strong></div>
                )}
                {product.availableDate && (
                  <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-gray-400 flex-shrink-0" /> Available From: <strong className="text-gray-900">{product.availableDate}</strong></div>
                )}
                <div className="flex items-center gap-2 text-gray-600">Domestic Delivery: <strong className="text-gray-900">{product.domesticDelivery ? 'Available' : 'Not available'}</strong></div>
                <div className="flex items-center gap-2 text-gray-600">Advance Booking: <strong className="text-gray-900">{product.advanceBooking ? 'Available' : 'Not available'}</strong></div>
              </div>
              {product.certifications && (
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                  <Award className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Certifications: <strong className="text-gray-900">{product.certifications}</strong></span>
                </div>
              )}
              {product.importantNotes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <strong className="text-gray-800">Important Notes:</strong> {product.importantNotes}
                </div>
              )}
            </div>

            {/* Export feasibility checker */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><Globe className="h-5 w-5 text-blue-600" /> Check Export Feasibility</h2>
              <p className="text-sm text-gray-500 mb-4">See an initial feasibility assessment for a destination country.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <select value={destination} onChange={e => setDestination(e.target.value)}
                  className="flex-1 px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={runEligibilityCheck} disabled={checking}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  <Search className="h-4 w-4" />
                  {checking ? 'Checking...' : 'Check Feasibility'}
                </button>
              </div>
              {eligibility && (
                <div className={`mt-4 p-4 rounded-lg border text-sm ${
                  eligibility.feasible ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="font-semibold">{eligibility.status}</p>
                  {Array.isArray(eligibility.reasons) && eligibility.reasons.length > 0 && (
                    <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                      {eligibility.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                  {Array.isArray(eligibility.requirements) && eligibility.requirements.length > 0 && (
                    <p className="mt-2 text-xs"><strong>Requirements:</strong> {eligibility.requirements.join(', ')}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Disclaimer:</strong> Export feasibility shown by the platform is an initial assessment and may require verification
                by authorized export, logistics, regulatory and compliance partners. All prices are reference data, not live market quotes.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller card */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                  {product.user?.name?.charAt(0) || 'F'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.user?.name || 'Farmer'}</p>
                  <p className="text-xs text-gray-500">{product.user?.role === 'FPO' ? 'FPO' : 'Farmer'} • {product.originState}</p>
                </div>
              </div>
            </div>

            {/* Quote CTA */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Interested in bulk supply?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Request a bulk quote. {product.upcomingHarvest && 'This is an upcoming harvest — quantity and availability are subject to actual harvest confirmation.'}
              </p>
              <button
                onClick={() => navigate(`/global/rfq/new?product=${product.id}&name=${encodeURIComponent(product.productName)}&qty=${product.moq}`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition"
              >
                Request Bulk Quote
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">RFQ workflow • AI supplier matching • Demo payment only</p>
            </div>

            {/* At a glance */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">At a glance</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Origin</dt><dd className="font-medium text-gray-900">{product.originState}, {product.countryOfOrigin}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Category</dt><dd className="font-medium text-gray-900">{product.category}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Currency</dt><dd className="font-medium text-gray-900">{product.currency}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Cold chain</dt><dd className="font-medium text-gray-900">{product.coldChainRequired ? 'Required' : 'Not required'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Upcoming harvest</dt><dd className="font-medium text-gray-900">{product.upcomingHarvest ? 'Yes' : 'No'}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}