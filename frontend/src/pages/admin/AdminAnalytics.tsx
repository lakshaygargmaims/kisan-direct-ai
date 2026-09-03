import { BarChart3, TrendingUp, DollarSign, Users, Package, Truck } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ORDER_DATA = [45, 52, 48, 61, 55, 72, 68, 80, 75, 88, 82, 95];
const REVENUE_DATA = [180, 210, 190, 245, 220, 288, 272, 320, 300, 352, 328, 380];
const SAVINGS_DATA = [8, 12, 10, 15, 13, 19, 17, 22, 20, 25, 23, 28];

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-green-600" />
        Platform Analytics
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total GMV', value: '₹32,40,000', icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Total Orders', value: '821', icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Logistics Savings', value: '₹2,19,000', icon: Truck, color: 'bg-purple-50 text-purple-600' },
          { label: 'Avg Order Value', value: '₹3,946', icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">Orders Over Time</h3>
          <div className="h-48 flex items-end justify-around gap-1">
            {ORDER_DATA.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="bg-blue-500 rounded-t w-full max-w-[30px] opacity-80" style={{ height: `${(v / 95) * 180}px` }} />
                <span className="text-xs text-gray-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">Revenue (₹K)</h3>
          <div className="h-48 flex items-end justify-around gap-1">
            {REVENUE_DATA.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="bg-green-500 rounded-t w-full max-w-[30px] opacity-80" style={{ height: `${(v / 380) * 180}px` }} />
                <span className="text-xs text-gray-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Savings */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">Logistics Savings (₹K)</h3>
          <div className="h-48 flex items-end justify-around gap-1">
            {SAVINGS_DATA.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="bg-purple-500 rounded-t w-full max-w-[30px] opacity-80" style={{ height: `${(v / 28) * 180}px` }} />
                <span className="text-xs text-gray-400">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">Product Category Distribution</h3>
          <div className="space-y-3">
            {[
              { name: 'Vegetables', pct: 35, color: 'bg-green-500' },
              { name: 'Grains', pct: 25, color: 'bg-amber-500' },
              { name: 'Fruits', pct: 20, color: 'bg-red-500' },
              { name: 'Dairy', pct: 10, color: 'bg-blue-500' },
              { name: 'Spices', pct: 5, color: 'bg-purple-500' },
              { name: 'Pulses', pct: 5, color: 'bg-orange-500' },
            ].map(c => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.name}</span>
                  <span className="font-medium">{c.pct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold mb-4">Key Performance Metrics</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Cancellation Rate', value: '8.5%', trend: '↓ 2.1%', good: true },
            { label: 'Avg Delivery Time', value: '2.4 hrs', trend: '↓ 0.3 hrs', good: true },
            { label: 'Farmer Satisfaction', value: '4.6/5', trend: '↑ 0.2', good: true },
            { label: 'Dispute Rate', value: '3.2%', trend: '↓ 0.5%', good: true },
          ].map(m => (
            <div key={m.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500">{m.label}</p>
              <p className="text-xl font-bold mt-1">{m.value}</p>
              <p className={`text-xs mt-1 ${m.good ? 'text-green-600' : 'text-red-600'}`}>{m.trend}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
