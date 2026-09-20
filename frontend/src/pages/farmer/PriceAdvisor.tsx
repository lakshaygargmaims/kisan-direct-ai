import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Minus, Zap, BarChart3 } from 'lucide-react';
import { MandiPriceCard } from '../../components/shared/MandiPriceCard';

const PRODUCTS = [
  { name: 'Tomato', fair: 28, market: { low: 24, high: 32 }, trend: 'UPWARD', change: 8.5, demand: 'HIGH' },
  { name: 'Onion', fair: 22, market: { low: 18, high: 26 }, trend: 'DOWNWARD', change: -3.2, demand: 'MEDIUM' },
  { name: 'Potato', fair: 18, market: { low: 15, high: 22 }, trend: 'STABLE', change: 0.5, demand: 'MEDIUM' },
  { name: 'Cauliflower', fair: 35, market: { low: 30, high: 40 }, trend: 'UPWARD', change: 5.0, demand: 'HIGH' },
  { name: 'Spinach', fair: 20, market: { low: 16, high: 24 }, trend: 'UPWARD', change: 12.0, demand: 'VERY_HIGH' },
  { name: 'Milk', fair: 55, market: { low: 48, high: 62 }, trend: 'STABLE', change: 1.2, demand: 'HIGH' },
];

const FORECASTS = [
  { product: 'Tomato', forecast: 'Tomato demand expected to increase in Delhi NCR. Prices may rise.', level: 'HIGH', change: 8.5 },
  { product: 'Onion', forecast: 'Onion supply is currently high in the region. Prices may drop.', level: 'MEDIUM', change: -3.2 },
  { product: 'Spinach', forecast: 'Winter demand surge expected for leafy greens.', level: 'VERY_HIGH', change: 12.0 },
  { product: 'Wheat', forecast: 'Stable demand. Rabi season harvest coming in.', level: 'MEDIUM', change: 0.8 },
];

export default function PriceAdvisor() {
  const [selectedProduct, setSelectedProduct] = useState('Tomato');

  const product = PRODUCTS.find(p => p.name === selectedProduct)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          AI Price Advisor
        </h1>
        <p className="text-gray-500">Get AI-powered pricing recommendations for your products</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Price Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">Market Prices</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRODUCTS.map(p => (
              <button key={p.name} onClick={() => setSelectedProduct(p.name)}
                className={`p-4 rounded-xl border text-left transition ${
                  selectedProduct === p.name ? 'border-green-500 bg-green-50 ring-2 ring-green-500' : 'hover:border-gray-300'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    p.trend === 'UPWARD' ? 'text-green-600' : p.trend === 'DOWNWARD' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {p.trend === 'UPWARD' ? <TrendingUp className="h-3 w-3" /> : p.trend === 'DOWNWARD' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {p.change > 0 ? '+' : ''}{p.change}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700 mt-2">₹{p.fair}<span className="text-sm font-normal text-gray-400">/kg</span></p>
                <p className="text-xs text-gray-400 mt-1">Range: ₹{p.market.low}–₹{p.market.high}</p>
              </button>
            ))}
          </div>

          {/* Selected Product Analysis */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">{product.name} - AI Analysis</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">AI Recommended Price</p>
                  <p className="text-3xl font-bold text-green-700">₹{product.fair}/kg</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Market Range</p>
                  <p className="text-lg font-semibold">₹{product.market.low} – ₹{product.market.high}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.demand === 'HIGH' ? 'bg-red-100 text-red-700' :
                    product.demand === 'VERY_HIGH' ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    Demand: {product.demand}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.trend === 'UPWARD' ? 'bg-green-100 text-green-700' : product.trend === 'DOWNWARD' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    Trend: {product.trend}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm">AI Recommendation</h4>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                  {product.trend === 'UPWARD'
                    ? `Demand for ${product.name} is increasing. Consider stocking up and pricing at ₹${product.fair}/kg. Good time to sell.`
                    : product.trend === 'DOWNWARD'
                    ? `Supply of ${product.name} is high. Current fair price is ₹${product.fair}/kg. Consider selling sooner rather than later.`
                    : `Market for ${product.name} is stable. Fair price is ₹${product.fair}/kg. Current pricing is competitive.`
                  }
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Price History (30 days)</p>
                  <div className="h-24 bg-gray-50 rounded-lg flex items-end justify-around px-2">
                    {Array(15).fill(0).map((_, i) => (
                      <div key={i} className="w-2 bg-green-400 rounded-t"
                        style={{ height: `${20 + Math.random() * 70}%`, opacity: 0.4 + (i * 0.04) }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real APMC Mandi Prices */}
          <MandiPriceCard productName={product.name} kisanDirectPrice={product.fair} />
        </div>

        {/* Demand Forecast */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Demand Forecasts
          </h2>
          <div className="space-y-3">
            {FORECASTS.map(f => (
              <div key={f.product} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{f.product}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.level === 'VERY_HIGH' ? 'bg-red-200 text-red-800' : f.level === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{f.level}</span>
                </div>
                <p className="text-sm text-gray-600">{f.forecast}</p>
                <p className={`text-sm font-medium mt-1 ${f.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Expected price change: {f.change > 0 ? '+' : ''}{f.change}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
