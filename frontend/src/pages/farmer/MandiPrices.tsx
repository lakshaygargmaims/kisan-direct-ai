import { useState, useEffect } from 'react';
import { BarChart3, Search, Filter, MapPin } from 'lucide-react';

interface MandiPrice {
  commodity: string;
  variety: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
}

export default function MandiPrices() {
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedMarket, setSelectedMarket] = useState('All');

  useEffect(() => {
    fetch('/api/mandi/prices')
      .then(r => r.json())
      .then(d => {
        if (d.success) setPrices(d.data.prices);
      })
      .finally(() => setLoading(false));
  }, []);

  const states = ['All', ...new Set(prices.map(p => p.state))];
  const markets = ['All', ...new Set(prices.filter(p => selectedState === 'All' || p.state === selectedState).map(p => p.market))];

  const filtered = prices.filter(p => {
    if (selectedState !== 'All' && p.state !== selectedState) return false;
    if (selectedMarket !== 'All' && p.market !== selectedMarket) return false;
    if (search && !p.commodity.toLowerCase().includes(search.toLowerCase()) &&
        !p.variety.toLowerCase().includes(search.toLowerCase()) &&
        !p.market.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by commodity
  const grouped: Record<string, MandiPrice[]> = {};
  for (const p of filtered) {
    if (!grouped[p.commodity]) grouped[p.commodity] = [];
    grouped[p.commodity].push(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-amber-600" />
          APMC Mandi Prices
        </h1>
        <p className="text-gray-500">Real market rates from Agricultural Marketing Division, Government of India</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search commodity, variety, or market..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedMarket('All'); }}
              className="px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none">
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}
              className="px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none">
              {markets.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading mandi prices...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Commodities</p>
              <p className="text-2xl font-bold text-amber-600">{Object.keys(grouped).length}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Markets Covered</p>
              <p className="text-2xl font-bold text-amber-600">{new Set(filtered.map(p => p.market)).size}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="text-sm text-gray-500">States</p>
              <p className="text-2xl font-bold text-amber-600">{new Set(filtered.map(p => p.state)).size}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="text-sm text-gray-500">Price Records</p>
              <p className="text-2xl font-bold text-amber-600">{filtered.length}</p>
            </div>
          </div>

          {/* Commodity groups */}
          {Object.entries(grouped).map(([commodity, commodityPrices]) => (
            <div key={commodity} className="bg-white rounded-xl border overflow-hidden shadow-sm">
              <div className="bg-amber-50 px-5 py-3 border-b">
                <h3 className="font-semibold text-amber-900">{commodity}</h3>
              </div>
              <div className="divide-y">
                {commodityPrices.map((p, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                    <div>
                      <div className="font-medium text-sm">{p.variety}</div>
                      <div className="text-xs text-gray-500">{p.market} • {p.state}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-700">₹{p.modalPrice}/{p.unit}</div>
                      <div className="text-xs text-gray-400">₹{p.minPrice} – ₹{p.maxPrice}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-amber-800">
        <p className="font-medium mb-1">ℹ️ Price Disclaimer</p>
        <p>These are indicative APMC mandi rates sourced from the Agricultural Marketing Division, Government of India.
        Actual transaction prices may vary based on quality, quantity, distance, and buyer-seller negotiation.
        Use these rates alongside KisanDirect AI Fair Price for informed decisions.</p>
      </div>
    </div>
  );
}
