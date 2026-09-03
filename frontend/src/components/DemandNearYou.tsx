import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Map, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const DEMAND_COLORS: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-400',
  LOW: 'bg-green-500',
};

const DEMAND_TEXT: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-green-400',
};

const DEMAND_EMOJI: Record<string, string> = {
  HIGH: '🔴',
  MEDIUM: '🟡',
  LOW: '🟢',
};

const PRODUCT_EMOJIS: Record<string, string> = {
  Tomato: '🍅',
  Potato: '🥔',
  Onion: '🧅',
  Wheat: '🌾',
  Rice: '🍚',
  Milk: '🥛',
  Corn: '🌽',
  Garlic: '🧄',
};

export default function DemandNearYou() {
  const { t } = useTranslation();
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getDemandNearby({
          lat: '28.6139',
          lng: '77.2090',
          radius: '25',
        });
        if (!cancelled) setDemands(data || []);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Map className="h-5 w-5 text-green-600" />
          {t('farmer.dashboard.demandNearYou') || 'Demand Near You'}
        </h3>
        <Link
          to="/farmer/demand-map"
          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
        >
          {t('farmer.dashboard.viewDemandMap') || 'View Demand Map'} →
        </Link>
      </div>

      <div className="space-y-2">
        {demands.slice(0, 5).map((d, i) => {
          const TrendIcon = d.demandScore >= 71 ? TrendingUp : d.demandScore >= 41 ? Minus : TrendingDown;
          return (
            <Link
              key={i}
              to={`/farmer/demand-map?product=${d.productName}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
            >
              <span className="text-xl">{PRODUCT_EMOJIS[d.productName] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{d.productName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DEMAND_TEXT[d.demandLevel]}`}>
                    {DEMAND_EMOJI[d.demandLevel]} {d.demandLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Within 25 km • Est. {d.estimatedDemandKg?.toLocaleString() || 0} kg • {d.activeBuyerCount || 0} buyers
                </p>
              </div>
              <TrendIcon className={`h-4 w-4 ${DEMAND_TEXT[d.demandLevel]}`} />
            </Link>
          );
        })}
      </div>

      {demands.length === 0 && !loading && (
        <div className="text-center py-6 text-gray-400">
          <Map className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No demand data available</p>
        </div>
      )}
    </div>
  );
}
