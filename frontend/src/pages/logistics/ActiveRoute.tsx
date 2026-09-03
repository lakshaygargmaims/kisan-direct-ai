import MapView, { MapMarker } from '../../components/shared/MapView';
import { MapPin, Clock, CheckCircle, Package } from 'lucide-react';

const DEMO_STOPS = [
  { seq: 1, label: 'Rajesh Farm (Pickup)', lat: 28.4595, lng: 77.0266, status: 'completed', time: '09:00 AM', qty: '600 kg' },
  { seq: 2, label: 'Hotel Fresh Picks, CP', lat: 28.6300, lng: 77.2170, status: 'completed', time: '09:45 AM', qty: '200 kg' },
  { seq: 3, label: 'Fresh Mart Retail, Noida', lat: 28.5355, lng: 77.3910, status: 'current', time: 'ETA 10:30 AM', qty: '250 kg' },
  { seq: 4, label: 'Spice Kitchen, Gurugram', lat: 28.4595, lng: 77.1200, status: 'pending', time: 'ETA 11:15 AM', qty: '150 kg' },
];

export default function ActiveRoute() {
  const markers: MapMarker[] = DEMO_STOPS.map((stop, i) => ({
    id: `stop-${stop.seq}`,
    lat: stop.lat,
    lng: stop.lng,
    type: i === 0 ? 'origin' : 'buyer',
    name: stop.label,
    icon: i === 0 ? '🌾' : stop.status === 'completed' ? '✅' : stop.status === 'current' ? '🚚' : '📦',
    popup: `
      <div style="min-width:150px;padding:4px 0">
        <div style="font-size:14px;font-weight:700">${stop.label}</div>
        <div style="font-size:12px;color:#666;margin-top:2px">Stop ${stop.seq} • ${stop.qty}</div>
        <div style="font-size:12px;color:#888;margin-top:2px">${stop.time}</div>
        ${stop.status === 'current' ? '<div style="font-size:11px;color:#2563eb;margin-top:4px;font-weight:600">📍 CURRENT LOCATION</div>' : ''}
      </div>
    `,
  }));

  const route = {
    points: DEMO_STOPS.map(s => ({ lat: s.lat, lng: s.lng })),
    color: '#2563eb',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-green-600" />
          Active Route — ROUTE-001
        </h1>
        <p className="text-gray-500">Multi-stop delivery with optimized sequence</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Real Map */}
        <div style={{ height: '480px' }}>
          <MapView
            markers={markers}
            route={route}
            center={{ lat: 28.55, lng: 77.15 }}
            zoom={10}
            className="rounded-xl overflow-hidden border shadow-sm h-full"
          />
        </div>

        {/* Route Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-4">Route Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400">Total Distance</p>
                <p className="font-bold">28.4 km</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400">Est. Time</p>
                <p className="font-bold">2h 15m</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400">Total Load</p>
                <p className="font-bold">600 kg</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400">Vehicle</p>
                <p className="font-bold">DEMO-101</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-4">Stop Sequence</h3>
            <div className="space-y-0">
              {DEMO_STOPS.map((stop, i) => (
                <div key={stop.seq} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      stop.status === 'completed' ? 'bg-green-500' :
                      stop.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                    }`}>
                      {stop.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : stop.seq}
                    </div>
                    {i < DEMO_STOPS.length - 1 && (
                      <div className={`w-0.5 h-10 ${stop.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${stop.status === 'current' ? 'text-blue-700' : ''}`}>
                        {stop.label}
                      </p>
                      {stop.status === 'current' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          📍 Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{stop.time} • {stop.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
