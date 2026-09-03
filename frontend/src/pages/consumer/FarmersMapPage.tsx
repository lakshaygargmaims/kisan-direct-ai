import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MapView, { MapMarker } from '../../components/shared/MapView';
import { Star, Leaf, Truck, MapPin, Loader2 } from 'lucide-react';
import { useMapFarmers, useMapHubs, useMapBuyers } from '../../hooks/queries';

// Consumer default: South Delhi
const CONSUMER = { lat: 28.5245, lng: 77.2066, name: 'Your Location' };

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export default function FarmersMapPage() {
  const [radius, setRadius] = useState(50);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [showHubs, setShowHubs] = useState(true);
  const [showBuyers, setShowBuyers] = useState(false);

  const { data: farmersData, isLoading: loadingFarmers } = useMapFarmers({
    lat: String(CONSUMER.lat),
    lng: String(CONSUMER.lng),
    radius: String(200), // fetch all, filter client-side for accurate distances
  });
  const { data: hubsData } = useMapHubs();
  const { data: buyersData } = useMapBuyers();

  const farmers: any[] = farmersData || [];
  const hubs: any[] = hubsData || [];
  const buyers: any[] = buyersData || [];

  // Compute real distances and filter by radius
  const farmersWithDistance = useMemo(() => {
    return farmers
      .filter((f: any) => f.lat && f.lng)
      .map((f: any) => ({
        ...f,
        distance: haversineDistance(CONSUMER.lat, CONSUMER.lng, f.lat, f.lng),
        deliveryCharge: Math.round(100 + haversineDistance(CONSUMER.lat, CONSUMER.lng, f.lat, f.lng) * 18 + (f.organic ? 50 : 0)),
      }))
      .filter((f: any) => f.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance);
  }, [farmers, radius]);

  const filteredHubs = useMemo(() => {
    return hubs
      .filter((h: any) => h.latitude && h.longitude)
      .map((h: any) => ({
        ...h,
        distance: haversineDistance(CONSUMER.lat, CONSUMER.lng, h.latitude, h.longitude),
      }))
      .filter((h: any) => h.distance <= radius);
  }, [hubs, radius]);

  const filteredBuyers = useMemo(() => {
    return buyers
      .filter((b: any) => b.lat && b.lng)
      .map((b: any) => ({
        ...b,
        distance: haversineDistance(CONSUMER.lat, CONSUMER.lng, b.lat, b.lng),
      }))
      .filter((b: any) => b.distance <= radius);
  }, [buyers, radius]);

  // Build markers for the map
  const markers: MapMarker[] = [
    {
      id: 'consumer',
      lat: CONSUMER.lat,
      lng: CONSUMER.lng,
      type: 'origin',
      name: 'Your Location',
      icon: '📍',
    },
    ...farmersWithDistance.map((f: any) => ({
      id: f.id,
      lat: f.lat,
      lng: f.lng,
      type: 'farmer' as const,
      name: f.name,
      popup: `
        <div style="min-width:180px;padding:4px 0">
          <div style="font-size:15px;font-weight:700;margin-bottom:4px">${f.name}</div>
          <div style="font-size:12px;color:#555;margin-bottom:2px">📍 ${f.city || 'NCR'} • ${f.distance} km</div>
          <div style="font-size:12px;color:#555;margin-bottom:2px">⭐ ${f.trustScore || 4.5} ${f.organic ? '• 🌿 Organic' : ''}</div>
          <div style="font-size:14px;font-weight:700;color:#16a34a">🚚 ₹${f.deliveryCharge}</div>
        </div>
      `,
    })),
    ...(showHubs ? filteredHubs.map((h: any) => ({
      id: h.id,
      lat: h.latitude,
      lng: h.longitude,
      type: 'hub' as const,
      name: h.name,
      popup: `<div style="padding:4px 0"><strong>${h.name}</strong><div style="font-size:12px;color:#666">${h.city || h.address || ''} • ${h.distance} km</div></div>`,
    })) : []),
    ...(showBuyers ? filteredBuyers.map((b: any) => ({
      id: b.id,
      lat: b.lat,
      lng: b.lng,
      type: 'buyer' as const,
      name: b.name,
      popup: `<div style="padding:4px 0"><strong>${b.name}</strong><div style="font-size:12px;color:#666">${b.city || ''} • ${b.businessType || ''} • ${b.distance} km</div></div>`,
    })) : []),
  ];

  // Route from consumer to selected farmer
  const route = selectedFarmer ? {
    points: [
      { lat: CONSUMER.lat, lng: CONSUMER.lng },
      { lat: selectedFarmer.lat, lng: selectedFarmer.lng },
    ],
    color: '#16a34a',
  } : undefined;

  if (loadingFarmers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-500">Loading farmers near you...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Find Farmers Near You</h1>
          <p className="text-gray-500">{farmersWithDistance.length} farmers within {radius} km • 📍 South Delhi</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={radius} onChange={e => setRadius(Number(e.target.value))}
            className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500">
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={showHubs} onChange={e => setShowHubs(e.target.checked)}
              className="rounded border-gray-300 text-green-600" />
            Hubs ({filteredHubs.length})
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={showBuyers} onChange={e => setShowBuyers(e.target.checked)}
              className="rounded border-gray-300 text-blue-600" />
            Buyers ({filteredBuyers.length})
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {/* Real Map */}
        <MapView
          markers={markers}
          route={route}
          center={{ lat: CONSUMER.lat, lng: CONSUMER.lng }}
          zoom={10}
          className="rounded-xl overflow-hidden border shadow-sm"
          onMarkerClick={(m) => {
            if (m.type === 'farmer') {
              const farmer = farmersWithDistance.find((f: any) => f.id === m.id);
              setSelectedFarmer(farmer);
            }
          }}
        />

        {/* Farmer List */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {farmersWithDistance.map((farmer: any) => (
            <div
              key={farmer.id}
              onClick={() => setSelectedFarmer(farmer)}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${
                selectedFarmer?.id === farmer.id ? 'ring-2 ring-green-500 border-green-300' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-700 shrink-0">
                    {farmer.name?.charAt(0) || '🌾'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{farmer.name}</h3>
                      {farmer.organic && <Leaf className="h-4 w-4 text-green-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{farmer.city || 'NCR'} • {farmer.distance} km away</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-700">🚚 ₹{farmer.deliveryCharge}</p>
                  <p className="text-xs text-gray-400">{farmer.distance} km</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> {farmer.trustScore || 85}
                </span>
                <span>{farmer.organic ? '🌿 Organic' : ''}</span>
              </div>
              {selectedFarmer?.id === farmer.id && (
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <Link to="/consumer/marketplace"
                    className="flex-1 bg-green-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                    View Products
                  </Link>
                  <button className="flex-1 border border-green-600 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition">
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          ))}
          {farmersWithDistance.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No farmers found within {radius} km</p>
              <p className="text-sm mt-1">Try increasing the radius</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
