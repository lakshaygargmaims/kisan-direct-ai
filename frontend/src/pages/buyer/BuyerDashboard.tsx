import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, ClipboardList, TrendingUp, DollarSign, Search, MapPin } from 'lucide-react';

export default function BuyerDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('buyer.dashboard.welcome', { name: '' })} 🏪</h1>
        <p className="text-gray-500">{t('buyer.dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('buyer.dashboard.totalOrders'), value: '5', icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: t('buyer.dashboard.totalSpend'), value: '₹3,45,000', icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: t('buyer.dashboard.suppliers'), value: '8', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
          { label: 'Avg Price', value: '₹28/kg', icon: Package, color: 'bg-amber-50 text-amber-600' },
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
        {/* Post Requirement */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold mb-4">{t('buyer.requirement.title')}</h2>
          <div className="space-y-3 text-sm">
            <input type="text" placeholder={t('buyer.requirement.product')} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder={t('buyer.requirement.quantity')} className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
              <input type="number" placeholder={t('buyer.requirement.maxPrice')} className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
            <input type="text" placeholder={t('buyer.requirement.deliveryLocation')} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
            <input type="date" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500" />
            <button className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition">
              {t('buyer.requirement.submit')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('buyer.requirement.responses')}</p>
        </div>

        {/* Nearby Supply */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold mb-4">{t('farmer.demandMap.title')}</h2>
          <div className="space-y-3">
            {[
              { farmer: 'Rajesh Farm', product: 'Tomato', qty: 500, price: 28, dist: 2.4, unit: 'kg' },
              { farmer: 'Singh Agro', product: 'Wheat', qty: 2000, price: 25, dist: 5.1, unit: 'kg' },
              { farmer: 'Prasad Dairy', product: 'Milk', qty: 100, price: 55, dist: 15.2, unit: 'L' },
              { farmer: 'Devi Organic', product: 'Apple', qty: 400, price: 80, dist: 25.7, unit: 'kg' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
                <div>
                  <p className="font-medium text-sm">{s.farmer}</p>
                  <p className="text-xs text-gray-500">{s.product} • {s.qty} {s.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">₹{s.price}/{s.unit}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.dist} {t('common.km')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">{t('buyer.dashboard.recentOrders')}</h2>
          <Link to="/buyer/orders" className="text-sm text-green-600 hover:underline">{t('common.viewAll')}</Link>
        </div>
        <div className="p-4 space-y-3">
          {[
            { id: '#B001', product: 'Tomato', qty: 500, amount: '₹14,000', status: 'IN_TRANSIT', farmer: 'Rajesh Farm' },
            { id: '#B002', product: 'Onion', qty: 300, amount: '₹6,600', status: 'COMPLETED', farmer: 'Singh Agro' },
            { id: '#B003', product: 'Milk', qty: 50, amount: '₹2,750', status: 'PREPARING', farmer: 'Prasad Dairy' },
          ].map(o => (
            <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">{o.id} • {o.product}</p>
                  <p className="text-xs text-gray-500">{o.qty} {o.product === 'Milk' ? 'L' : 'kg'} {o.farmer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{o.amount}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  o.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                }`}>{o.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
