import { DollarSign, TrendingUp, Package, Users, Truck, Star } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REVENUE_DATA = [45000, 52000, 48000, 61000, 55000, 72000, 68000, 80000, 75000, 88000, 82000, 95000];

export default function FarmerAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Farm Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '₹8,61,000', icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Products Sold', value: '12,450 kg', icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Repeat Buyers', value: '18', icon: Users, color: 'bg-purple-50 text-purple-600' },
          { label: 'Avg Rating', value: '4.7 ⭐', icon: Star, color: 'bg-yellow-50 text-yellow-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className={`p-2 rounded-lg ${s.color} inline-block mb-2`}><Icon className="h-5 w-5" /></div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold mb-4">Monthly Revenue</h3>
        <div className="h-64 flex items-end justify-around gap-1 sm:gap-2">
          {REVENUE_DATA.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs text-gray-400 hidden sm:block">₹{(val / 1000).toFixed(0)}K</span>
              <div className="bg-green-500 rounded-t-md w-full max-w-[40px]"
                style={{ height: `${(val / 95000) * 200}px` }} />
              <span className="text-xs text-gray-400">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {[
              { name: 'Tomato', revenue: '₹2,80,000', pct: 35, qty: '10,000 kg' },
              { name: 'Onion', revenue: '₹1,76,000', pct: 22, qty: '8,000 kg' },
              { name: 'Potato', revenue: '₹1,08,000', pct: 14, qty: '6,000 kg' },
              { name: 'Spinach', revenue: '₹96,000', pct: 12, qty: '4,800 kg' },
              { name: 'Chili', revenue: '₹81,000', pct: 10, qty: '1,800 kg' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-500">{p.revenue}</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Savings */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold mb-4">Logistics Savings (via Order Clubbing)</h3>
          <div className="text-center py-6">
            <Truck className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-4xl font-bold text-green-600">₹42,000</p>
            <p className="text-sm text-gray-500 mt-1">Total saved this year</p>
            <p className="text-sm text-gray-400 mt-3">Through 28 clubbed deliveries</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="font-bold text-green-700">₹1,500</p>
              <p className="text-xs text-gray-500">Avg saved/delivery</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="font-bold text-blue-700">40%</p>
              <p className="text-xs text-gray-500">Avg cost reduction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Repeat Buyers */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="font-semibold mb-4">Top Repeat Buyers</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Hotel Fresh Picks', orders: 12, spent: '₹1,68,000', rating: '4.8' },
            { name: 'Grand Plaza Hotel', orders: 8, spent: '₹96,000', rating: '4.6' },
            { name: 'Fresh Mart Retail', orders: 15, spent: '₹2,10,000', rating: '4.9' },
            { name: 'Spice Kitchen', orders: 6, spent: '₹72,000', rating: '4.5' },
          ].map(b => (
            <div key={b.name} className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                  {b.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{b.name}</span>
              </div>
              <p className="text-xs text-gray-500">{b.orders} orders • {b.spent}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
