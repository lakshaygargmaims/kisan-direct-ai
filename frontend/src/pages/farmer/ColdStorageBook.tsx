import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Thermometer, Star, ShieldCheck, Phone, Clock, ScrollText, Calculator } from 'lucide-react';
import { coldStorageApi, Facility, StorageQuote } from '../../services/coldStorageApi';
import { toast } from 'sonner';

const COMMON_CROPS = ['Potato', 'Onion', 'Tomato', 'Apple', 'Peas', 'Carrot', 'Cauliflower', 'Garlic', 'Wheat', 'Rice'];

export default function ColdStorageBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  // booking form
  const [productName, setProductName] = useState('Potato');
  const [quantityKg, setQuantityKg] = useState('500');
  const [durationDays, setDurationDays] = useState('15');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [harvestDate, setHarvestDate] = useState('');
  const [packaging, setPackaging] = useState('50 kg sacks');
  const [specialReqs, setSpecialReqs] = useState('');
  const [quote, setQuote] = useState<StorageQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ booking: any; batch: any } | null>(null);

  useEffect(() => {
    coldStorageApi.getFacility(id!)
      .then(setFacility)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchQuote = async () => {
    if (!id) return;
    setQuoting(true);
    try {
      const q = await coldStorageApi.getQuote(id, {
        productName,
        quantityKg: parseFloat(quantityKg),
        durationDays: parseInt(durationDays),
      });
      setQuote(q);
    } catch (e: any) {
      setQuote(null);
      toast.error(e.message);
    } finally {
      setQuoting(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await coldStorageApi.createBooking({
        facilityId: id,
        productName,
        quantityKg: parseFloat(quantityKg),
        qualityGrade,
        harvestDate: harvestDate || undefined,
        durationDays: parseInt(durationDays),
        packaging,
        specialReqs: specialReqs || undefined,
      });
      setConfirmed(result);
      toast.success('Storage booked! Batch created.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading facility…</div>;
  if (!facility) return <div className="p-8 text-red-500">Facility not found.</div>;

  // ── Confirmation screen ──
  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Product Stored Successfully!</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Batch ID</span><span className="font-mono font-bold text-cyan-800">{confirmed.batch.batchCode}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Product</span><span className="font-semibold">{confirmed.batch.productName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Quantity</span><span className="font-semibold">{confirmed.batch.initialQtyKg} kg</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Facility</span><span className="font-semibold">{facility.name}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Stored until</span><span className="font-semibold">{new Date(confirmed.batch.expectedEndDate).toLocaleDateString('en-IN')}</span></div>
          <div className="flex justify-between text-sm border-t pt-3"><span className="text-gray-500">Paid (demo wallet)</span><span className="font-bold">₹{confirmed.booking.totalAmount.toLocaleString('en-IN')}</span></div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to="/farmer/cold-storage/inventory" className="px-5 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800">
            View My Stored Products
          </Link>
          <Link to="/farmer/cold-storage" className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700">
            Back to Find Storage
          </Link>
        </div>
      </div>
    );
  }

  const isFull = facility.availableCapacityKg <= 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/farmer/cold-storage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-700">← Back to Find Storage</Link>

      {/* Facility overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {facility.name}
              {facility.isVerified && <ShieldCheck className="w-5 h-5 text-green-600" aria-label="Verified" />}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {facility.address || facility.city} • {facility.distanceKm} km away</p>
            <p className="text-xs text-gray-400 mt-1">Operated by {facility.operator || 'Registered partner'}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-gray-900">₹{facility.pricePerKgPerDay}</div>
            <div className="text-xs text-gray-500">per kg / per day</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-cyan-50 rounded-xl p-3">
            <div className="text-xs text-gray-500">Available Capacity</div>
            <div className="font-bold text-cyan-800">{facility.availableCapacityKg.toLocaleString('en-IN')} kg</div>
            <div className="text-[10px] text-gray-400">of {facility.capacityKg.toLocaleString('en-IN')} kg</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temperature</div>
            <div className="font-bold text-blue-800">{facility.tempMinC}°C to {facility.tempMaxC}°C</div>
            <div className="text-[10px] text-gray-400">{facility.storageType.replace(/_/g, ' ')}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" /> Rating</div>
            <div className="font-bold text-amber-800">{facility.rating} / 5</div>
            <div className="text-[10px] text-gray-400">{facility.reviewCount} reviews</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Hours</div>
            <div className="font-bold text-gray-800 text-xs mt-1">{facility.operatingHours || '—'}</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-semibold">Supported crops:</span>{' '}
          {facility.supportedCrops.map((c, i) => (
            <span key={c} className={`inline-block px-2 py-0.5 rounded-full text-xs mr-1 mb-1 ${productName === c ? 'bg-cyan-700 text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</span>
          ))}
        </div>

        {facility.rules && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 flex gap-2">
            <ScrollText className="w-4 h-4 shrink-0 text-gray-400" />
            <div><span className="font-semibold">Facility rules:</span> {facility.rules}</div>
          </div>
        )}
        {facility.contactPhone && (
          <div className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {facility.contactPhone}</div>
        )}
      </div>

      {/* Booking form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-gray-900 text-lg">Book Storage</h2>
        {isFull && <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">This facility is currently full. Try another one.</div>}

        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="text-gray-600 font-medium">Product *</span>
            <select value={productName} onChange={(e) => { setProductName(e.target.value); setQuote(null); }} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 bg-white">
              {Array.from(new Set([...facility.supportedCrops, ...COMMON_CROPS])).map((c) => <option key={c}>{c}</option>)}
            </select>
            {!facility.supportedCrops.includes(productName) && (
              <span className="text-[11px] text-amber-600 mt-1 block">⚠️ Not listed as supported here — confirm with facility.</span>
            )}
          </label>
          <label className="text-sm">
            <span className="text-gray-600 font-medium">Quantity (kg) *</span>
            <input type="number" min={facility.minQuantityKg} value={quantityKg} onChange={(e) => { setQuantityKg(e.target.value); setQuote(null); }} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            <span className="text-[11px] text-gray-400">Min {facility.minQuantityKg} kg • Available {facility.availableCapacityKg.toLocaleString('en-IN')} kg</span>
          </label>
          <label className="text-sm">
            <span className="text-gray-600 font-medium">Storage duration (days) *</span>
            <input type="number" min={1} max={facility.maxDurationDays} value={durationDays} onChange={(e) => { setDurationDays(e.target.value); setQuote(null); }} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            <span className="text-[11px] text-gray-400">Max {facility.maxDurationDays} days</span>
          </label>
          <label className="text-sm">
            <span className="text-gray-600 font-medium">Quality Grade</span>
            <select value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 bg-white">
              {['A+', 'A', 'B+', 'B', 'C'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-gray-600 font-medium">Harvest Date</span>
            <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600 font-medium">Packaging</span>
            <select value={packaging} onChange={(e) => setPackaging(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 bg-white">
              {['50 kg sacks', '25 kg bags', 'Crates (20 kg)', 'Bulk / loose', 'Boxes'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-gray-600 font-medium">Special requirements</span>
            <textarea value={specialReqs} onChange={(e) => setSpecialReqs(e.target.value)} rows={2} placeholder="e.g. separate pallet for organic, ethylene absorber" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
          </label>
        </div>

        {/* Cost calculation */}
        <div className="rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-cyan-900 flex items-center gap-2"><Calculator className="w-4 h-4" /> Storage Cost Calculation</span>
            <button onClick={fetchQuote} disabled={quoting || isFull} className="px-4 py-2 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 disabled:opacity-50">
              {quoting ? 'Calculating…' : 'Calculate Cost'}
            </button>
          </div>
          {quote && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-mono text-xs text-cyan-800 bg-white rounded-lg px-3 py-2">{quote.calculation}</div>
              <div className="flex justify-between"><span className="text-gray-500">Storage cost</span><span className="font-semibold">₹{quote.storageCost.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform fee ({quote.platformFeePercent}%)</span><span className="font-semibold">₹{quote.platformFee.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Refundable security deposit ({quote.depositPercent}%)</span><span className="font-semibold">₹{quote.deposit.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between border-t pt-2 text-base"><span className="font-bold text-gray-900">Total payable</span><span className="font-extrabold text-cyan-800">₹{quote.total.toLocaleString('en-IN')}</span></div>
              <p className="text-[11px] text-gray-400">Deposit is refunded when you withdraw the product. Final charges settle on actual storage days.</p>
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!quote || submitting || isFull}
          className="w-full py-3 rounded-xl bg-cyan-700 text-white font-bold hover:bg-cyan-800 disabled:opacity-40"
        >
          {submitting ? 'Booking…' : `Confirm Storage Booking${quote ? ` — ₹${quote.total.toLocaleString('en-IN')}` : ''}`}
        </button>
        <p className="text-[11px] text-gray-400 text-center">Demo mode: payment is simulated via demo wallet. No real money is charged.</p>
      </div>
    </div>
  );
}
