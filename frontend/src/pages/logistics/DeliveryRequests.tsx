import { Truck, MapPin, Package, Clock } from 'lucide-react';

const DEMO_REQUESTS = [
  { id: 'DEL-004', from: 'Rajesh Farm', fromCity: 'Gurugram', to: 'Spice Kitchen', toCity: 'Gurugram DLF', product: 'Tomato', qty: '150 kg', weight: '150kg', dist: '15.1 km', fare: '₹180', cold: false, status: 'PENDING' },
  { id: 'DEL-005', from: 'Devi Organic', fromCity: 'Sonipat', to: 'Fresh Mart', toCity: 'Noida', product: 'Apple', qty: '200 kg', weight: '200kg', dist: '32.5 km', fare: '₹380', cold: true, status: 'PENDING' },
  { id: 'DEL-006', from: 'Prasad Dairy', fromCity: 'Bahadurgarh', to: 'Grand Plaza', toCity: 'South Delhi', product: 'Milk + Paneer', qty: '50 kg', weight: '50kg', dist: '22.3 km', fare: '₹260', cold: true, status: 'PENDING' },
];

export default function DeliveryRequests() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Delivery Requests</h1>
      <p className="text-gray-500">Available delivery requests near you</p>

      <div className="space-y-4">
        {DEMO_REQUESTS.map(req => (
          <div key={req.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{req.id}</span>
                  {req.cold && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">❄️ Cold Chain</span>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>{req.from}, {req.fromCity}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{req.to}, {req.toCity}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {req.product} • {req.weight}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {req.dist}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">{req.fare}</p>
                <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  Accept
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
