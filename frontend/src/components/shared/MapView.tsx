import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'farmer' | 'buyer' | 'hub' | 'origin' | 'destination';
  name: string;
  popup?: string;
  icon?: string;
}

export interface MapRoute {
  points: { lat: number; lng: number }[];
  color?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  route?: MapRoute;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

const MARKER_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  farmer: { bg: '#16a34a', border: '#15803d', icon: '🌾' },
  buyer: { bg: '#2563eb', border: '#1d4ed8', icon: '🏪' },
  hub: { bg: '#9333ea', border: '#7c3aed', icon: '📦' },
  origin: { bg: '#dc2626', border: '#b91c1c', icon: '📍' },
  destination: { bg: '#ea580c', border: '#c2410c', icon: '🏁' },
};

function createMarkerElement(marker: MapMarker) {
  const colors = MARKER_COLORS[marker.type] || MARKER_COLORS.farmer;
  const el = document.createElement('div');
  el.className = 'kisan-marker';
  el.style.cssText = `
    width: 36px; height: 36px; cursor: pointer;
    background: ${colors.bg}; border: 3px solid ${colors.border};
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 16px; color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.2s; position: relative;
  `;
  el.innerHTML = marker.icon || colors.icon;
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
  return el;
}

export default function MapView({ markers, route, center, zoom = 11, className = '', onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const prevMarkerCount = useRef(0);
  const hasInitialized = useRef(false);

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const mapCenter = center || (markers.length > 0
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: 28.6139, lng: 77.2090 });

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
      center: [mapCenter.lng, mapCenter.lat],
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 200 }), 'bottom-left');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers — only fit bounds on mount or when marker count changes significantly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const updateMarkers = () => {
      markers.forEach(marker => {
        const el = createMarkerElement(marker);

        const popupHtml = marker.popup || `
          <div style="padding:4px 0;min-width:120px">
            <strong style="font-size:14px">${marker.name}</strong>
            <div style="font-size:12px;color:#666;margin-top:2px">${marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}</div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setHTML(popupHtml);

        const m = new maplibregl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(map);

        if (onMarkerClick) {
          el.addEventListener('click', () => onMarkerClick(marker));
        }

        markersRef.current.push(m);
      });

      // Fit bounds on first load OR when marker count changes significantly (e.g. product switch)
      const shouldFit = !hasInitialized.current ||
        (markers.length > 0 && Math.abs(markers.length - prevMarkerCount.current) > 2);

      if (shouldFit && markers.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        markers.forEach(m => bounds.extend([m.lng, m.lat]));
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        hasInitialized.current = true;
      }

      prevMarkerCount.current = markers.length;
    };

    if (map.isStyleLoaded()) {
      updateMarkers();
    } else {
      const handler = () => { updateMarkers(); map.off('load', handler); };
      map.on('load', handler);
    }
  }, [markers, onMarkerClick]);

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const drawRoute = () => {
      try {
        if (map.getLayer('route')) map.removeLayer('route');
        if (map.getLayer('route-bg')) map.removeLayer('route-bg');
        if (map.getSource('route')) map.removeSource('route');
      } catch { /* not present yet */ }

      if (!route || route.points.length < 2) return;

      const coordinates = route.points.map(p => [p.lng, p.lat]);

      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        },
      });

      map.addLayer({
        id: 'route-bg',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#1e293b', 'line-width': 8, 'line-opacity': 0.5 },
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': route.color || '#16a34a',
          'line-width': 5,
          'line-dasharray': [2, 1],
        },
      });
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.on('load', drawRoute);
    }
  }, [route]);

  const [legendOpen, setLegendOpen] = useState(true);

  return (
    <div className={`relative ${className}`} style={{ height: '100%', minHeight: '300px' }}>
      <div ref={mapContainer} className="w-full h-full rounded-xl" style={{ height: '100%' }} />
      {/* Legend — collapsible */}
      <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-md border z-20 transition-all">
        <button onClick={() => setLegendOpen(!legendOpen)} className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-50 rounded-lg text-xs">
          <span className="font-semibold">Map Legend</span>
          <span className="text-gray-400 text-xs">{legendOpen ? '▼' : '▲'}</span>
        </button>
        {legendOpen && (
          <div className="px-3 pb-2 space-y-1 text-xs">
            {['farmer', 'buyer', 'hub'].map(type => {
              const c = MARKER_COLORS[type];
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.bg }} />
                  <span className="capitalize">{type}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
