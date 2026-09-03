import { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export default function DeliveryRules() {
  const [rules, setRules] = useState([
    { product: 'Dairy', maxRadius: 30, coldChain: true, maxTransit: 12, interstate: false, sameDay: true },
    { product: 'Vegetables', maxRadius: 50, coldChain: false, maxTransit: 24, interstate: false, sameDay: false },
    { product: 'Fruits', maxRadius: 50, coldChain: true, maxTransit: 24, interstate: false, sameDay: false },
    { product: 'Grains', maxRadius: 100, coldChain: false, maxTransit: 48, interstate: true, sameDay: false },
    { product: 'Pulses', maxRadius: 100, coldChain: false, maxTransit: 48, interstate: true, sameDay: false },
    { product: 'Spices', maxRadius: 100, coldChain: false, maxTransit: 48, interstate: true, sameDay: false },
  ]);

  const [policy, setPolicy] = useState({
    beforeAcceptance: 100, afterAcceptance: 90, afterPreparation: 75, afterLogistics: 50, afterPickup: 10,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-green-600" />
        Delivery Rules & Cancellation Policy
      </h1>

      {/* Delivery Rules */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="font-semibold mb-4">Product Delivery Rules</h2>
        <p className="text-sm text-gray-500 mb-4">Configure delivery parameters by product category. These rules determine delivery eligibility.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Max Radius (km)</th>
                <th className="text-left px-4 py-3 font-medium">Cold Chain</th>
                <th className="text-left px-4 py-3 font-medium">Max Transit (h)</th>
                <th className="text-left px-4 py-3 font-medium">Interstate</th>
                <th className="text-left px-4 py-3 font-medium">Same Day</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map((r, i) => (
                <tr key={r.product} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.product}</td>
                  <td className="px-4 py-3">
                    <input type="number" value={r.maxRadius}
                      onChange={e => { const n = [...rules]; n[i].maxRadius = +e.target.value; setRules(n); }}
                      className="w-20 px-2 py-1 border rounded text-sm" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={r.coldChain}
                      onChange={e => { const n = [...rules]; n[i].coldChain = e.target.checked; setRules(n); }}
                      className="rounded border-gray-300 text-green-600" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" value={r.maxTransit}
                      onChange={e => { const n = [...rules]; n[i].maxTransit = +e.target.value; setRules(n); }}
                      className="w-20 px-2 py-1 border rounded text-sm" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={r.interstate}
                      onChange={e => { const n = [...rules]; n[i].interstate = e.target.checked; setRules(n); }}
                      className="rounded border-gray-300 text-green-600" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={r.sameDay}
                      onChange={e => { const n = [...rules]; n[i].sameDay = e.target.checked; setRules(n); }}
                      className="rounded border-gray-300 text-green-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="font-semibold mb-4">Cancellation Policy (% Refund)</h2>
        <p className="text-sm text-gray-500 mb-4">Configure refund percentages for each cancellation stage.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries({
            beforeAcceptance: 'Before Acceptance',
            afterAcceptance: 'After Acceptance',
            afterPreparation: 'After Preparation',
            afterLogistics: 'Logistics Assigned',
            afterPickup: 'After Pickup',
          }).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={100}
                  value={(policy as any)[key]}
                  onChange={e => setPolicy({ ...policy, [key]: +e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
                <span className="text-sm text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2">
          <Save className="h-4 w-4" /> Save Policy
        </button>
      </div>
    </div>
  );
}
