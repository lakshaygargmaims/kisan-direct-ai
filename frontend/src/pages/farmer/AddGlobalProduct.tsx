import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Globe, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { createGlobalProduct } from '../../services/globalTradeApi';

const CATEGORIES = ['Grains', 'Spices', 'Fruits', 'Pulses', 'Dairy', 'Vegetables', 'Processed', 'Other'];
const GRADES = ['A+', 'A', 'B+', 'B', 'C'];
const UNITS = ['kg', 'tonnes', 'quintal', 'bags', 'pieces', 'litres'];
const CURRENCIES = ['INR', 'USD', 'EUR'];
const INDIAN_STATES = [
  'Haryana', 'Punjab', 'Uttar Pradesh', 'Rajasthan', 'Maharashtra', 'Gujarat',
  'Madhya Pradesh', 'Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Kerala', 'Bihar',
  'West Bengal', 'Odisha', 'Jammu & Kashmir', 'Telangana', 'Assam', 'Himachal Pradesh',
];

const EXPORT_STATUSES = [
  { value: 'EXPORT_ELIGIBLE_WITH_VERIFICATION', label: 'Export Eligible (Verification Required)' },
  { value: 'EXPORT_POTENTIAL', label: 'Export Potential' },
  { value: 'EXPORT_ELIGIBLE', label: 'Export Eligible' },
  { value: 'INTERSTATE_DELIVERY', label: 'Interstate Delivery' },
  { value: 'DOMESTIC_DELIVERY', label: 'Domestic Delivery Only' },
  { value: 'LOCAL_ONLY', label: 'Local Only' },
];

export default function AddGlobalProduct() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productName: '',
    category: '',
    description: '',
    originState: '',
    countryOfOrigin: 'India',
    availableQuantity: '',
    unit: 'kg',
    moq: '',
    maxSupplyCapacity: '',
    availableDate: '',
    harvestDate: '',
    upcomingHarvest: false,
    advanceBooking: false,
    qualityGrade: 'A',
    expectedPrice: '',
    currency: 'INR',
    packagingOptions: '',
    shelfLife: '',
    storageRequirement: '',
    coldChainRequired: false,
    domesticDelivery: true,
    exportStatus: 'EXPORT_ELIGIBLE_WITH_VERIFICATION',
    certifications: '',
    importantNotes: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(form.availableQuantity);
    const moq = Number(form.moq);
    if (form.moq && moq > quantity) {
      toast.error('MOQ cannot be greater than available quantity');
      return;
    }
    if (!form.originState) {
      toast.error('Please select your origin state');
      return;
    }
    setSaving(true);
    try {
      await createGlobalProduct({
        productName: form.productName,
        category: form.category,
        description: form.description || undefined,
        originState: form.originState,
        countryOfOrigin: form.countryOfOrigin,
        availableQuantity: quantity,
        unit: form.unit,
        moq: moq || quantity,
        maxSupplyCapacity: form.maxSupplyCapacity ? Number(form.maxSupplyCapacity) : undefined,
        availableDate: form.availableDate || undefined,
        harvestDate: form.harvestDate || undefined,
        upcomingHarvest: form.upcomingHarvest,
        advanceBooking: form.advanceBooking,
        qualityGrade: form.qualityGrade,
        expectedPrice: Number(form.expectedPrice),
        currency: form.currency,
        packagingOptions: form.packagingOptions || undefined,
        shelfLife: form.shelfLife || undefined,
        storageRequirement: form.storageRequirement || undefined,
        coldChainRequired: form.coldChainRequired,
        domesticDelivery: form.domesticDelivery,
        exportStatus: form.exportStatus,
        certifications: form.certifications || undefined,
        importantNotes: form.importantNotes || undefined,
      });
      toast.success('Product listed on the Global Market!');
      navigate('/farmer/global-listings');
    } catch (err: any) {
      toast.error(err.message || 'Failed to list product');
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500";
  const labelCls = "block text-sm font-medium mb-1";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/farmer/global-listings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')} My Global Listings
      </Link>

      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-300" />
          <div>
            <h1 className="text-2xl font-bold">List Product on Global Market</h1>
            <p className="text-blue-200 text-sm mt-1">Indian Farms to Global Markets — reach international bulk buyers</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        {/* Product basics */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Product Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Product Name *</label>
              <input type="text" value={form.productName} onChange={e => update('productName', e.target.value)} required
                placeholder="e.g., Basmati Rice" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} required className={inputCls}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
              placeholder="Variety, quality notes, growing region..." className={inputCls} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Origin State *</label>
              <select value={form.originState} onChange={e => update('originState', e.target.value)} required className={inputCls}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Country of Origin</label>
              <input type="text" value={form.countryOfOrigin} onChange={e => update('countryOfOrigin', e.target.value)} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Quantity & price */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Quantity & Price</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Available Quantity *</label>
              <input type="number" min="0" value={form.availableQuantity} onChange={e => update('availableQuantity', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select value={form.unit} onChange={e => update('unit', e.target.value)} className={inputCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>MOQ (Min Order Qty)</label>
              <input type="number" min="0" value={form.moq} onChange={e => update('moq', e.target.value)} placeholder="Defaults to available qty" className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Max Supply Capacity</label>
              <input type="number" min="0" value={form.maxSupplyCapacity} onChange={e => update('maxSupplyCapacity', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expected Price *</label>
              <input type="number" min="0" value={form.expectedPrice} onChange={e => update('expectedPrice', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={form.currency} onChange={e => update('currency', e.target.value)} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Available From</label>
              <input type="date" value={form.availableDate} onChange={e => update('availableDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Harvest Date</label>
              <input type="date" value={form.harvestDate} onChange={e => update('harvestDate', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quality Grade</label>
              <select value={form.qualityGrade} onChange={e => update('qualityGrade', e.target.value)} className={inputCls}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Shelf Life</label>
              <input type="text" value={form.shelfLife} onChange={e => update('shelfLife', e.target.value)} placeholder="e.g., 12 months" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Export details */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Export & Logistics</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Export Availability Status</label>
              <select value={form.exportStatus} onChange={e => update('exportStatus', e.target.value)} className={inputCls}>
                {EXPORT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Packaging Options</label>
              <input type="text" value={form.packagingOptions} onChange={e => update('packagingOptions', e.target.value)} placeholder="e.g., 25 kg bags" className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Storage Requirements</label>
              <input type="text" value={form.storageRequirement} onChange={e => update('storageRequirement', e.target.value)} placeholder="e.g., Cool, dry place" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Certifications</label>
              <input type="text" value={form.certifications} onChange={e => update('certifications', e.target.value)} placeholder="e.g., FSSAI, Organic, APEDA" className={inputCls} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.coldChainRequired} onChange={e => update('coldChainRequired', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              Cold Chain Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.upcomingHarvest} onChange={e => update('upcomingHarvest', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              Upcoming Harvest Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.advanceBooking} onChange={e => update('advanceBooking', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              Advance Booking Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.domesticDelivery} onChange={e => update('domesticDelivery', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              Domestic Delivery Available
            </label>
          </div>
          <div>
            <label className={labelCls}>Important Notes</label>
            <textarea value={form.importantNotes} onChange={e => update('importantNotes', e.target.value)} rows={2}
              placeholder="Anything buyers should know..." className={inputCls} />
          </div>
        </section>

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Export feasibility shown here is an <strong>initial assessment</strong> and may require verification by authorized export,
            logistics, regulatory and compliance partners. This does not guarantee legal exportability or future prices.
          </p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className="h-5 w-5" />
          {saving ? 'Listing...' : 'List on Global Market'}
        </button>
      </form>
    </div>
  );
}