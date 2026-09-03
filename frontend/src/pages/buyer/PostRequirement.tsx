import { useState } from 'react';
import { ClipboardList, Check } from 'lucide-react';

export default function PostRequirement() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', maxPrice: '', location: '', requiredBy: '', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="text-center py-16">
      <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Requirement Posted!</h2>
      <p className="text-gray-500">Farmers and FPOs near you will be notified and can submit offers.</p>
      <button onClick={() => { setSubmitted(false); setForm({ product: '', quantity: '', maxPrice: '', location: '', requiredBy: '', notes: '' }); }}
        className="mt-6 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700">Post Another</button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <ClipboardList className="h-6 w-6 text-green-600" />
        Post a Requirement
      </h1>
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product *</label>
            <input type="text" value={form.product} onChange={e => setForm({...form, product: e.target.value})} required
              placeholder="e.g., Fresh Tomatoes" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity (kg) *</label>
              <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price/kg (₹)</label>
              <input type="number" value={form.maxPrice} onChange={e => setForm({...form, maxPrice: e.target.value})}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery Location *</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required
              placeholder="Address or city" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Required By *</label>
            <input type="date" value={form.requiredBy} onChange={e => setForm({...form, requiredBy: e.target.value})} required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3}
              placeholder="Quality requirements, delivery window, etc." className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition">
            Post Requirement
          </button>
        </form>
      </div>
    </div>
  );
}
