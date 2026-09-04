import { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, Package, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';

// Major Indian export hubs
const INDIA_HUBS = [
  { name: 'Mumbai Port', lat: 18.9501, lng: 72.8355, type: 'port' },
  { name: 'Chennai Port', lat: 13.0878, lng: 80.2785, type: 'port' },
  { name: 'Kandla Port (Gujarat)', lat: 23.0225, lng: 70.2100, type: 'port' },
  { name: 'Kochi Port', lat: 9.9312, lng: 76.2673, type: 'port' },
  { name: 'Delhi NCR Hub', lat: 28.6139, lng: 77.2090, type: 'collection' },
  { name: 'Panipat Collection Hub', lat: 29.3909, lng: 76.9635, type: 'collection' },
  { name: 'Noida Consolidation', lat: 28.5355, lng: 77.3910, type: 'collection' },
  { name: 'Gurugram Warehouse', lat: 28.4595, lng: 77.0266, type: 'warehouse' },
];

const BUYER_DESTD = [
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, flag: '🇦🇪' },
  { name: 'Hamburg, Germany', lat: 53.5511, lng: 9.9937, flag: '🇩🇪' },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, flag: '🇬🇧' },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, flag: '🇯🇵' },
  { name: 'Jeddah, Saudi Arabia', lat: 21.4858, lng: 39.1925, flag: '🇸🇦' },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, flag: '🇦🇺' },
  { name: 'Shanghai, China', lat: 31.2304, lng: 121.4737, flag: '🇨🇳' },
  { name: 'Marseille, France', lat: 43.2965, lng: 5.3698, flag: '🇫🇷' },
  { name: 'Barcelona, Spain', lat: 41.3874, lng: 2.1686, flag: '🇪🇸' },
  { name: 'Busan, South Korea', lat: 35.1796, lng: 129.0756, flag: '🇰🇷' },
];

const SUPPLY_ROUTES = [
  { from: INDIA_HUBS[0], to: BUYER_DESTD[0], product: 'Spices', qty: '15,000 kg', method: 'Sea Freight' },
  { from: INDIA_HUBS[2], to: BUYER_DESTD[1], product: 'Turmeric', qty: '20,000 kg', method: 'Sea Freight' },
  { from: INDIA_HUBS[0], to: BUYER_DESTD[2], product: 'Alphonso Mango', qty: '5,000 kg', method: 'Air Freight' },
  { from: INDIA_HUBS[1], to: BUYER_DESTD[3], product: 'Cardamom', qty: '3,000 kg', method: 'Air Freight' },
  { from: INDIA_HUBS[4], to: BUYER_DESTD[4], product: 'Red Chili', qty: '10,000 kg', method: 'Sea Freight' },
  { from: INDIA_HUBS[0], to: BUYER_DESTD[5], product: 'Pomegranate', qty: '8,000 kg', method: 'Temp Control' },
  { from: INDIA_HUBS[2], to: BUYER_DESTD[6], product: 'Cumin', qty: '25,000 kg', method: 'Sea Freight' },
  { from: INDIA_HUBS[4], to: BUYER_DESTD[7], product: 'Organic Dal', qty: '20,000 kg', method: 'Sea Freight' },
  { from: INDIA_HUBS[3], to: BUYER_DESTD[8], product: 'Saffron', qty: '100 kg', method: 'Air Freight' },
  { from: INDIA_HUBS[2], to: BUYER_DESTD[9], product: 'Basmati Rice', qty: '30,000 kg', method: 'Sea Freight' },
];

export default function GlobalTradeMap() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [50, 20],
      zoom: 2.2,
      minZoom: 2,
      maxZoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // India markers
      INDIA_HUBS.forEach(hub => {
        const el = document.createElement('div');
        const color = hub.type === 'port' ? '#1d4ed8' : hub.type === 'collection' ? '#059669' : '#d97706';
        el.innerHTML = `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;"></div>`;
        el.title = hub.name;
        new maplibregl.Marker({ element: el })
          .setLngLat([hub.lng, hub.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding:8px;font-family:sans-serif;">
              <strong>${hub.name}</strong><br/>
              <span style="color:#666;font-size:12px;">Type: ${hub.type}</span>
            </div>
          `))
          .addTo(map);
      });

      // Destination markers
      BUYER_DESTD.forEach(dest => {
        const el = document.createElement('div');
        el.innerHTML = `<div style="font-size:20px;cursor:pointer;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${dest.flag}</div>`;
        el.title = dest.name;
        new maplibregl.Marker({ element: el })
          .setLngLat([dest.lng, dest.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="padding:8px;font-family:sans-serif;">
              <strong>${dest.flag} ${dest.name}</strong>
            </div>
          `))
          .addTo(map);
      });

      // Routes as curved lines
      SUPPLY_ROUTES.forEach((route, i) => {
        const color = route.method === 'Air Freight' ? '#ef4444' : route.method === 'Sea Freight' ? '#3b82f6' : '#f59e0b';
        const coords: [number, number][] = [
          [route.from.lng, route.from.lat],
          [(route.from.lng + route.to.lng) / 2, Math.max(route.from.lat, route.to.lat) + 5], // curve point
          [route.to.lng, route.to.lat],
        ];

        map.addSource(`route-${i}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: {},
          },
        });

        map.addLayer({
          id: `route-line-${i}`,
          type: 'line',
          source: `route-${i}`,
          paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.6 },
        });

        // Route label at midpoint
        const el = document.createElement('div');
        el.innerHTML = `<div style="background:${color};color:white;padding:2px 6px;border-radius:8px;font-size:9px;white-space:nowrap;font-family:sans-serif;cursor:pointer;">${route.product}</div>`;
        el.onclick = () => setSelectedRoute(route);
        new maplibregl.Marker({ element: el })
          .setLngLat(coords[1])
          .addTo(map);
      });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-blue-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Globe className="w-6 h-6 text-blue-300" />
          <h1 className="text-xl font-bold">Global Trade Routes</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-300">
          <div className="w-3 h-1 bg-blue-500 rounded" /> Sea
          <div className="w-3 h-1 bg-red-500 rounded ml-2" /> Air
          <div className="w-3 h-1 bg-amber-500 rounded ml-2" /> Temp Control
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Map */}
        <div ref={mapContainer} className="flex-1" />

        {/* Side Panel */}
        {selectedRoute && (
          <div className="absolute right-4 top-4 bg-white rounded-xl shadow-xl border w-80 p-4 z-10">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-gray-900">{selectedRoute.product}</h3>
              <button onClick={() => setSelectedRoute(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">From:</span><span className="font-medium">{selectedRoute.from.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To:</span><span className="font-medium">{selectedRoute.to.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quantity:</span><span className="font-medium">{selectedRoute.qty}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Method:</span><span className="font-medium">{selectedRoute.method}</span></div>
            </div>
          </div>
        )}

        {/* Legend — collapsible */}
        <div className="absolute left-4 bottom-4 bg-white rounded-xl shadow-lg border z-20 transition-all">
          <button onClick={() => setLegendOpen(!legendOpen)} className="flex items-center gap-2 px-4 py-2.5 w-full text-left hover:bg-gray-50 rounded-xl">
            <h4 className="font-bold text-sm text-gray-900">Legend</h4>
            {legendOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </button>
          {legendOpen && (
            <div className="px-4 pb-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-700" /> Indian Port</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600" /> Collection Hub</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> Warehouse</div>
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500 rounded" /> Sea Freight</div>
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-red-500 rounded" /> Air Freight</div>
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-amber-500 rounded" /> Temp Control</div>
              <div className="mt-3 pt-3 border-t text-[10px] text-gray-400">Demo / Simulated Routes</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
