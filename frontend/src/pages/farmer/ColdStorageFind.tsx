import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Thermometer, Star, ShieldCheck, Phone, Snowflake, ChevronRight } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { coldStorageApi, Facility } from '../../services/coldStorageApi';
import { useAuthStore } from '../../store/auth';

const CROP_FILTERS = ['All', 'Potato', 'Onion', 'Tomato', 'Apple', 'Peas', 'Wheat'];

export default function ColdStorageFind() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [crop, setCrop] = useState('All');
  const [radius, setRadius] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = { radius, includeFull: 'true' };
    if (crop !== 'All') params.crop = crop;
    if (user?.id) {
      // Uses farmer's city centre via backend default if lat/lng absent
    }
    coldStorageApi
      .getFacilities(params)
      .then((d) => { if (!cancelled) setFacilities(d.facilities); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [crop, radius, user?.id]);

  const nearest = useMemo(() => facilities[0], [facilities]);

  // Initialize map once the container exists (after loading resolves)
  useEffect(() => {
    if (loading || mapRef.current || !mapContainerRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] },
      center: [77.1, 28.7],
      zoom: 8.2,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;
  }, [loading]);

  // Cleanup on unmount
  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  // Add/update markers when facilities or the map become ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || facilities.length === 0) return;
    markersRef.current.forEach((m) => m.remove());
    const markers: maplibregl.Marker[] = [];
    facilities.forEach((f) => {
      const el = document.createElement('div');
      el.style.cssText = `width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:${f.isFull ? '#9ca3af' : '#0891b2'};color:#fff;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer;`;
      el.textContent = '🧊';
      el.title = f.name;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([f.longitude, f.latitude])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setHTML(
          `<strong>${f.name}</strong><br/>${f.distanceKm} km • ${f.isFull ? '🔴 Full' : '🟢 Available'}<br/>₹${f.pricePerKgPerDay}/kg/day<br/><a href="/farmer/cold-storage/${f.id}" onclick="window.location.href='/farmer/cold-storage/${f.id}';return false;">View & Book →</a>`
        ))
        .addTo(map);
      el.addEventListener('click', () => navigate(`/farmer/cold-storage/${f.id}`));
      markers.push(marker);
    });
    if (facilities.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      facilities.forEach((f) => bounds.extend([f.longitude, f.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 11 });
    }
    markersRef.current = markers;
  }, [facilities, loading, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🧊 Find Cold Storage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Store your harvest safely and choose when to sell — "Farmer ko majboori mein fasal saste daam par bechni nahi padegi."
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {CROP_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setCrop(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              crop === c ? 'bg-cyan-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-cyan-400'
            }`}
          >
            {c}
          </button>
        ))}
        <select value={radius} onChange={(e) => setRadius(e.target.value)} className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
          <option value="50">Within 50 km</option>
          <option value="100">Within 100 km</option>
          <option value="250">Within 250 km</option>
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{error}</div>}
      <>
          {/* Map — always mounted so the maplibre container exists */}
          <div ref={mapContainerRef} className="w-full h-72 rounded-2xl border border-gray-200 overflow-hidden relative z-0" />

          {loading && <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">Loading nearby facilities…</div>}

          {!loading && (
          <>

          {/* Facility cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {facilities.length === 0 && (
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
                No facilities match this filter. Try widening the radius.
              </div>
            )}
            {facilities.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {f.name}
                      {f.isVerified && <ShieldCheck className="w-4 h-4 text-green-600" aria-label="Verified" />}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {f.distanceKm} km • {f.city}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${f.isFull ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {f.isFull ? '🔴 Full' : '🟢 Available'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-cyan-50 rounded-lg p-2">
                    <div className="text-gray-500">Available</div>
                    <div className="font-bold text-cyan-800">{f.availableCapacityKg.toLocaleString('en-IN')} kg</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-gray-500 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp</div>
                    <div className="font-bold text-blue-800">{f.tempMinC}°C – {f.tempMaxC}°C</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2">
                    <div className="text-gray-500 flex items-center gap-1"><Star className="w-3 h-3" /> Rating</div>
                    <div className="font-bold text-amber-800">{f.rating} ({f.reviewCount})</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <span className="font-medium">Supported:</span> {f.supportedCrops.slice(0, 4).join(' • ')}
                  {f.supportedCrops.length > 4 && ` +${f.supportedCrops.length - 4}`}
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-lg font-extrabold text-gray-900">₹{f.pricePerKgPerDay}</span>
                    <span className="text-xs text-gray-500">/kg/day</span>
                    <div className="text-[10px] text-gray-400">Min {f.minQuantityKg} kg • Max {f.maxDurationDays} days</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/farmer/cold-storage/${f.id}`)}
                      className="px-4 py-2 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 transition-colors"
                    >
                      Book Storage
                    </button>
                  </div>
                </div>
                {f === nearest && (
                  <div className="text-[10px] text-cyan-700 font-semibold">📍 Nearest to you</div>
                )}
              </div>
            ))}
          </div>
          </>
          )}
        </>

      <div className="text-[11px] text-gray-400">
        Facility details, availability and rates are provided by registered storage partners and may change. Confirm on booking.
      </div>
    </div>
  );
}
