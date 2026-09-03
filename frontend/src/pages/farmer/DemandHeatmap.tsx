import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDemandHeatmap, useDemandRecommendation } from '../../hooks/queries';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin, Filter, X, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Brain,
  Users, Package, DollarSign, Truck, Layers,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────

const PRODUCTS = [
  { name: 'Tomato', emoji: '🍅' }, { name: 'Potato', emoji: '🥔' },
  { name: 'Onion', emoji: '🧅' },  { name: 'Wheat', emoji: '🌾' },
  { name: 'Rice', emoji: '🍚' },   { name: 'Milk', emoji: '🥛' },
  { name: 'Corn', emoji: '🌽' },   { name: 'Garlic', emoji: '🧄' },
];

const RADII = [10, 25, 50, 100];

const COLORS: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#eab308', LOW: '#22c55e' };
const BG: Record<string, string> = {
  HIGH: 'bg-red-50 border-red-200 text-red-800',
  MEDIUM: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  LOW: 'bg-green-50 border-green-200 text-green-800',
};
const LABELS: Record<string, string> = { HIGH: '🔴 HIGH DEMAND', MEDIUM: '🟡 MEDIUM DEMAND', LOW: '🟢 LOW DEMAND' };

// Farmer's actual location from seed data (Rajesh Kumar, Gurugram area)
const FARMER_LAT = 28.4595;
const FARMER_LNG = 77.0266;

// ─── Zone Detail Card ───────────────────────────────────────────

function ZoneDetailCard({ zone, recommendation, onShowRec, showRec, onClose }: {
  zone: any; recommendation: any; showRec: boolean;
  onShowRec: () => void; onClose: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Demand Zone</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-lg transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`rounded-xl p-4 border mb-4 ${BG[zone.demandLevel]}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold">{zone.name}</span>
          <span className="text-xs opacity-75">• {zone.areaName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black">{zone.demandScore}</span>
          <div>
            <p className="text-sm font-bold">{LABELS[zone.demandLevel]}</p>
            <p className="text-xs opacity-75">out of 100</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: Package, label: 'Estimated Demand', value: `${zone.totalDemandKg.toLocaleString()} kg` },
          { icon: Users, label: 'Active Buyers', value: zone.activeBuyers },
          { icon: DollarSign, label: 'Avg Offered Price', value: `₹${zone.avgOfferedPrice}/kg` },
          { icon: Truck, label: 'Distance', value: `${zone.distanceKm} km` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-[11px]">{label}</span>
            </div>
            <p className="text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">B2B Requirements</span>
          <span className="font-medium">{zone.b2bRequirements}</span>
        </div>
      </div>

      <button onClick={onShowRec}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-medium transition">
        <Brain className="h-4 w-4" /> AI Market Opportunity
        {showRec ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showRec && recommendation && (
        <div className="mt-4 bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-sm">AI Market Opportunity</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3 leading-relaxed">{recommendation.recommendation}</p>
          <div className="space-y-2 text-sm">
            {[
              ['Potential demand', `${recommendation.potentialDemandKg?.toLocaleString()} kg`],
              ['Suggested quantity', recommendation.suggestedQuantity],
              ['Nearby buyers', recommendation.nearbyBuyers],
              ['Seasonal trend', recommendation.seasonalTrend === 'UPWARD' ? '📈 UPWARD'
                : recommendation.seasonalTrend === 'DOWNWARD' ? '📉 DOWNWARD' : '➡️ STABLE'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 pt-3 border-t border-purple-500/20 text-[10px] text-gray-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Advisory only — not a guarantee of sales or prices
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Zone List Item ─────────────────────────────────────────────

function ZoneListItem({ zone, isSelected, onClick }: { zone: any; isSelected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-lg p-3 transition border ${
        isSelected ? 'bg-gray-700 border-gray-500' : 'bg-gray-700/50 border-transparent hover:bg-gray-700 hover:border-gray-600'
      }`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[zone.demandLevel] }} />
          <span className="font-medium text-sm">{zone.name}</span>
        </div>
        <span className="text-xs font-bold">{zone.demandScore}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{zone.areaName} • {zone.distanceKm} km</span>
        <span>{zone.totalDemandKg} kg • {zone.activeBuyers} buyers</span>
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function DemandHeatmap() {
  const { t } = useTranslation();
  const [product, setProduct] = useState('Tomato');
  const [radius, setRadius] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [showRec, setShowRec] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const prevProduct = useRef(product);
  const hasFitBounds = useRef(false);

  const heatmapParams = { product, lat: String(FARMER_LAT), lng: String(FARMER_LNG), radius: String(radius) };
  const recParams = { product, lat: String(FARMER_LAT), lng: String(FARMER_LNG) };

  const { data: heatmap, isLoading } = useDemandHeatmap(heatmapParams);
  const { data: recommendation } = useDemandRecommendation(recParams);

  const zones = heatmap?.zones || [];

  // ─── Initialize MapLibre map ──────────────────────────────────

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
      },
      center: [FARMER_LNG, FARMER_LAT],
      zoom: 10,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), 'bottom-left');

    // Add farmer marker
    const farmerEl = document.createElement('div');
    farmerEl.style.cssText = `
      width: 44px; height: 44px; border-radius: 50%;
      background: #16a34a; border: 3px solid #15803d;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; box-shadow: 0 2px 12px rgba(22,163,74,0.5);
      position: relative; cursor: pointer;
    `;
    farmerEl.innerHTML = '👨‍🌾';

    new maplibregl.Marker({ element: farmerEl })
      .setLngLat([FARMER_LNG, FARMER_LAT])
      .setPopup(new maplibregl.Popup({ offset: 30 }).setHTML(`
        <div style="padding:4px 0;min-width:100px;text-align:center">
          <strong style="font-size:14px">Your Farm</strong>
          <div style="font-size:12px;color:#666;margin-top:2px">Rajesh Kumar</div>
        </div>
      `))
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ─── Update zone markers when data changes ────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      // Remove old zone markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      zones.forEach((zone: any) => {
        // Zone circle marker
        const el = document.createElement('div');
        const size = 30 + zone.demandScore * 0.5;
        const color = COLORS[zone.demandLevel];
        el.style.cssText = `
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; opacity: 0.7; cursor: pointer;
          box-shadow: 0 0 ${8 + zone.demandScore * 0.3}px ${color};
          transition: transform 0.2s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center;
        `;
        el.innerHTML = `<span style="font-size:${Math.max(10, size * 0.35)}px;font-weight:900;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.5)">${zone.demandScore}</span>`;

        el.addEventListener('mouseenter', () => { el.style.opacity = '1'; el.style.transform = 'scale(1.3)'; });
        el.addEventListener('mouseleave', () => { el.style.opacity = '0.7'; el.style.transform = 'scale(1)'; });
        el.addEventListener('click', () => { setSelectedZone(zone); setShowRec(false); });

        // Zone label
        const labelEl = document.createElement('div');
        labelEl.style.cssText = `
          position: absolute; top: ${size + 4}px; left: 50%; transform: translateX(-50%);
          white-space: nowrap; text-align: center; pointer-events: none;
        `;
        labelEl.innerHTML = `
          <div style="font-size:11px;font-weight:700;color:white;background:rgba(0,0,0,0.7);padding:1px 6px;border-radius:4px">${zone.name}</div>
          <div style="font-size:9px;color:#ccc;margin-top:1px">${zone.areaName}</div>
        `;
        el.appendChild(labelEl);
        el.style.position = 'relative';

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([zone.longitude, zone.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Fit bounds on first load or product change (not on radius/filter changes)
      const productChanged = prevProduct.current !== product;
      prevProduct.current = product;
      if (zones.length > 0 && (!hasFitBounds.current || productChanged)) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([FARMER_LNG, FARMER_LAT]);
        zones.forEach((z: any) => bounds.extend([z.longitude, z.latitude]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
        hasFitBounds.current = true;
      }
    };

    if (map.isStyleLoaded()) {
      update();
    } else {
      map.on('load', update);
    }
  }, [zones]);

  // ─── Fly to selected zone ─────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedZone) return;
    map.flyTo({ center: [selectedZone.longitude, selectedZone.latitude], zoom: 12, duration: 800 });
  }, [selectedZone]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-400" />
          <h1 className="text-lg font-bold">AI Demand Heatmap</h1>
        </div>
        <div className="flex-1 flex items-center gap-2 overflow-x-auto px-2">
          {PRODUCTS.map((p) => (
            <button key={p.name} onClick={() => { setProduct(p.name); setSelectedZone(null); setShowRec(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                product === p.name ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              <span>{p.emoji}</span> <span>{p.name}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Radius:</span>
            {RADII.map((r) => (
              <button key={r} onClick={() => setRadius(r)}
                className={`px-2.5 py-1 rounded text-xs font-medium ${radius === r ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                {r} km
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto text-xs">
            <span className="w-3 h-3 rounded-full bg-red-500" /> High
            <span className="w-3 h-3 rounded-full bg-yellow-400 ml-2" /> Medium
            <span className="w-3 h-3 rounded-full bg-green-500 ml-2" /> Low
          </div>
        </div>
      )}

      {/* Main Content: Map + Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map Area — real MapLibre GL JS */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Stats overlay */}
          <div className="absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur rounded-xl p-4 border border-gray-700 max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{PRODUCTS.find(p => p.name === product)?.emoji}</span>
              <div>
                <h3 className="font-bold text-sm">{product}</h3>
                <p className="text-xs text-gray-400">Demand Analysis</p>
              </div>
            </div>
            {heatmap && (
              <div className="space-y-2 text-xs">
                {[
                  ['Zones analyzed', heatmap.zoneCount],
                  ['High demand', <span key="h" className="text-red-400">{heatmap.highDemandZones}</span>],
                  ['Medium demand', <span key="m" className="text-yellow-400">{heatmap.mediumDemandZones}</span>],
                  ['Low demand', <span key="l" className="text-green-400">{heatmap.lowDemandZones}</span>],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-gray-400">{label}</span><span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-gray-700">
                  <span className="text-gray-400">Seasonal factor</span>
                  <span className="font-medium">{heatmap.seasonalFactor}x ({heatmap.season})</span>
                </div>
              </div>
            )}
            <p className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Simulated demand data for demo
            </p>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-gray-800/90 backdrop-blur rounded-lg px-3 py-2 border border-gray-700">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-gray-300">HIGH (71-100)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-gray-300">MEDIUM (41-70)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-300">LOW (0-40)</span></div>
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
              <div className="bg-gray-800 rounded-xl px-6 py-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-400 border-t-transparent" />
                <span className="text-sm">Analyzing demand data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className={`bg-gray-800 border-l border-gray-700 flex flex-col ${selectedZone ? 'w-96' : 'w-80'} transition-all duration-300 shrink-0 overflow-hidden`}>
          {selectedZone ? (
            <ZoneDetailCard zone={selectedZone} recommendation={recommendation}
              showRec={showRec} onShowRec={() => setShowRec(!showRec)}
              onClose={() => { setSelectedZone(null); setShowRec(false); }} />
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-sm font-bold mb-3 text-gray-300 uppercase tracking-wide">Demand Zones ({zones.length})</h2>
              <div className="space-y-2">
                {zones.map((zone: any) => (
                  <ZoneListItem key={zone.id} zone={zone} isSelected={false}
                    onClick={() => { setSelectedZone(zone); setShowRec(false); }} />
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-700 p-3 shrink-0">
            <div className="flex items-center justify-around text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-gray-400">HIGH (71-100)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="text-gray-400">MEDIUM (41-70)</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-gray-400">LOW (0-40)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
