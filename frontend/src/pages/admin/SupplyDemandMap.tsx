import { useState } from 'react';
import MapView, { MapMarker } from '../../components/shared/MapView';
import { Map } from 'lucide-react';

const PRODUCTS = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Milk', 'Rice'];

const SUPPLY_POINTS: Record<string, { city: string; lat: number; lng: number; qty: number }[]> = {
  Tomato: [
    { city: 'Gurugram', lat: 28.46, lng: 77.03, qty: 2000 },
    { city: 'Noida', lat: 28.54, lng: 77.39, qty: 1500 },
    { city: 'Faridabad', lat: 28.41, lng: 77.32, qty: 800 },
  ],
  Onion: [
    { city: 'Panipat', lat: 29.39, lng: 76.96, qty: 5000 },
    { city: 'Sonipat', lat: 28.98, lng: 77.02, qty: 3000 },
  ],
  Potato: [
    { city: 'Meerut', lat: 28.98, lng: 77.71, qty: 4000 },
    { city: 'Ghaziabad', lat: 28.67, lng: 77.45, qty: 2500 },
  ],
  Wheat: [
    { city: 'Meerut', lat: 28.98, lng: 77.71, qty: 10000 },
    { city: 'Panipat', lat: 29.39, lng: 76.96, qty: 8000 },
    { city: 'Sonipat', lat: 28.98, lng: 77.02, qty: 6000 },
  ],
  Milk: [
    { city: 'Bahadurgarh', lat: 28.67, lng: 76.93, qty: 200 },
    { city: 'Gurugram', lat: 28.46, lng: 77.03, qty: 150 },
  ],
  Rice: [
    { city: 'Meerut', lat: 28.98, lng: 77.71, qty: 5000 },
  ],
};

const DEMAND_POINTS: Record<string, { city: string; lat: number; lng: number; qty: number }[]> = {
  Tomato: [
    { city: 'South Delhi', lat: 28.52, lng: 77.21, qty: 500 },
    { city: 'Connaught Place', lat: 28.63, lng: 77.22, qty: 1000 },
    { city: 'Noida Sector 62', lat: 28.62, lng: 77.36, qty: 300 },
  ],
  Onion: [
    { city: 'New Delhi', lat: 28.61, lng: 77.21, qty: 2000 },
    { city: 'Faridabad', lat: 28.41, lng: 77.32, qty: 1500 },
  ],
  Potato: [
    { city: 'Connaught Place', lat: 28.63, lng: 77.22, qty: 800 },
    { city: 'South Delhi', lat: 28.52, lng: 77.21, qty: 600 },
  ],
  Wheat: [
    { city: 'Faridabad', lat: 28.41, lng: 77.32, qty: 2000 },
    { city: 'New Delhi', lat: 28.61, lng: 77.21, qty: 3000 },
  ],
  Milk: [
    { city: 'New Delhi', lat: 28.61, lng: 77.21, qty: 200 },
    { city: 'Noida', lat: 28.54, lng: 77.39, qty: 150 },
  ],
  Rice: [
    { city: 'New Delhi', lat: 28.61, lng: 77.21, qty: 2000 },
  ],
};

export default function SupplyDemandMap() {
  const [product, setProduct] = useState('Tomato');

  const supply = SUPPLY_POINTS[product] || [];
  const demand = DEMAND_POINTS[product] || [];
  const totalSupply = supply.reduce((s, p) => s + p.qty, 0);
  const totalDemand = demand.reduce((s, p) => s + p.qty, 0);

  const markers: MapMarker[] = [
    ...supply.map((p, i) => ({
      id: `supply-${i}`,
      lat: p.lat,
      lng: p.lng,
      type: 'farmer' as const,
      name: p.city,
      icon: '🟢',
      popup: `<div style="padding:4px 0"><strong>Supply: ${p.city}</strong><div style="color:#16a34a;font-weight:700">${p.qty.toLocaleString()} kg</div></div>`,
    })),
    ...demand.map((p, i) => ({
      id: `demand-${i}`,
      lat: p.lat,
      lng: p.lng,
      type: 'buyer' as const,
      name: p.city,
      icon: '🔴',
      popup: `<div style="padding:4px 0"><strong>Demand: ${p.city}</strong><div style="color:#dc2626;font-weight:700">${p.qty.toLocaleString()} kg</div></div>`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6 text-green-600" />
          Supply & Demand Heatmap
        </h1>
        <select value={product} onChange={e => setProduct(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500">
          {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Real Map */}
        <div className="lg:col-span-2" style={{ height: '500px' }}>
          <MapView
            markers={markers}
            center={{ lat: 28.6139, lng: 77.2090 }}
            zoom={10}
            className="rounded-xl overflow-hidden border shadow-sm h-full"
          />
        </div>

        {/* Data Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-3 text-green-700">🟢 Supply Points — {product}</h3>
            <div className="space-y-2">
              {supply.map((p, i) => (
                <div key={i} className="p-3 bg-green-50 rounded-lg text-sm">
                  <p className="font-medium">{p.city}</p>
                  <p className="text-green-700">{p.qty.toLocaleString()} kg available</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-3 text-red-700">🔴 Demand Points — {product}</h3>
            <div className="space-y-2">
              {demand.map((p, i) => (
                <div key={i} className="p-3 bg-red-50 rounded-lg text-sm">
                  <p className="font-medium">{p.city}</p>
                  <p className="text-red-700">{p.qty.toLocaleString()} kg needed</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-3">📊 Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Supply</span>
                <span className="font-medium text-green-600">{totalSupply.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Demand</span>
                <span className="font-medium text-red-600">{totalDemand.toLocaleString()} kg</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Balance</span>
                <span className={totalSupply > totalDemand ? 'text-green-600' : 'text-red-600'}>
                  {totalSupply > totalDemand ? `Surplus +${(totalSupply - totalDemand).toLocaleString()} kg` : `Deficit -${(totalDemand - totalSupply).toLocaleString()} kg`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
