import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Globe, Package, Truck, Calendar, ArrowLeft } from 'lucide-react';
import { createRFQ } from '../../services/globalTradeApi';

const DESTINATIONS = [
  'UAE', 'Saudi Arabia', 'Germany', 'United Kingdom', 'France', 'Japan', 'South Korea',
  'China', 'Australia', 'United States', 'Canada', 'Netherlands', 'Spain', 'Italy', 'Singapore',
];

const QUALITY_GRADES = ['A+', 'A', 'A/B', 'B', 'Organic Certified'];

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    productRequired: searchParams.get('name') || '',
    requiredQuantity: searchParams.get('qty') || '',
    unit: 'kg',
    destinationCountry: '',
    destinationCity: '',
    destinationPort: '',
    deliveryTimeline: '',
    qualityRequirements: '',
    packagingRequirements: '',
    coldChainRequired: false,
    targetPrice: '',
    preferredCurrency: 'USD',
    additionalNotes: '',
  });

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productRequired || !form.requiredQuantity || !form.destinationCountry) return;
    setSubmitting(true);
    try {
      await createRFQ({
        ...form,
        requiredQuantity: parseFloat(form.requiredQuantity as string),
        targetPrice: form.targetPrice ? parseFloat(form.targetPrice as string) : undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/global/rfqs'), 2000);
    } catch (err) {
      console.error('Failed to create RFQ', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RFQ Submitted Successfully!</h2>
          <p className="text-gray-500 mb-6">AI is now finding the best suppliers for your requirement. Redirecting to your RFQs...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-emerald-200 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-emerald-300" />
            <div>
              <h1 className="text-3xl font-bold">Request Bulk Quote (RFQ)</h1>
              <p className="text-emerald-200 mt-1">Tell us what you need — AI will match you with the best Indian suppliers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Details */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <Package className="w-5 h-5 text-blue-600" /> Product Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name *</label>
                <input type="text" required value={form.productRequired} onChange={e => update('productRequired', e.target.value)}
                  placeholder="e.g., Basmati Rice, Turmeric Powder, Alphonso Mango"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Required Quantity *</label>
                <input type="number" required min="1" value={form.requiredQuantity} onChange={e => update('requiredQuantity', e.target.value)}
                  placeholder="e.g., 20000" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unit</label>
                <select value={form.unit} onChange={e => update('unit', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500">
                  <option value="kg">Kilograms (kg)</option>
                  <option value="tonnes">Tonnes</option>
                  <option value="quintals">Quintals</option>
                  <option value="pieces">Pieces</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Quality Requirements</label>
                <select value={form.qualityRequirements} onChange={e => update('qualityRequirements', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select quality grade</option>
                  {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Packaging Requirements</label>
                <input type="text" value={form.packagingRequirements} onChange={e => update('packagingRequirements', e.target.value)}
                  placeholder="e.g., 25 kg vacuum bags" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="coldChain" checked={form.coldChainRequired}
                  onChange={e => update('coldChainRequired', e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded" />
                <label htmlFor="coldChain" className="text-sm font-medium text-gray-700">Cold Chain Required</label>
              </div>
            </div>
          </div>

          {/* Destination Details */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <Truck className="w-5 h-5 text-blue-600" /> Destination Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Destination Country *</label>
                <select required value={form.destinationCountry} onChange={e => update('destinationCountry', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select country</option>
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Destination City</label>
                <input type="text" value={form.destinationCity} onChange={e => update('destinationCity', e.target.value)}
                  placeholder="e.g., Dubai, Hamburg" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Port / Airport</label>
                <input type="text" value={form.destinationPort} onChange={e => update('destinationPort', e.target.value)}
                  placeholder="e.g., Jebel Ali Port" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          {/* Timeline & Pricing */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" /> Timeline & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Required Delivery By</label>
                <input type="text" value={form.deliveryTimeline} onChange={e => update('deliveryTimeline', e.target.value)}
                  placeholder="e.g., November 2026" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Target Price (optional)</label>
                <input type="number" step="0.01" value={form.targetPrice} onChange={e => update('targetPrice', e.target.value)}
                  placeholder="per unit" className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Preferred Currency</label>
                <select value={form.preferredCurrency} onChange={e => update('preferredCurrency', e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl border p-6">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Additional Notes</label>
            <textarea rows={4} value={form.additionalNotes} onChange={e => update('additionalNotes', e.target.value)}
              placeholder="Any specific requirements, certifications needed, preferred supplier profiles..."
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 transition">
              {submitting ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Submitting...</>
              ) : (
                <><FileText className="w-5 h-5" /> Submit Bulk RFQ</>
              )}
            </button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Note:</strong> Submitting this RFQ will trigger AI supplier matching. You will receive notifications when potential suppliers are found and when offers are submitted.
          </div>
        </form>
      </div>
    </div>
  );
}
