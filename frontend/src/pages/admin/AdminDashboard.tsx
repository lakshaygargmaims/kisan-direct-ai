import { useAdminDashboard } from '../../hooks/queries';
import { useTranslation } from 'react-i18next';
import { Users, Package, DollarSign, Truck } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('admin.dashboard.totalFarmers'), value: stats?.users?.farmers || 10, icon: Users, color: 'bg-green-50 text-green-600' },
          { label: t('admin.dashboard.totalOrders'), value: stats?.orders?.total || 50, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: t('admin.dashboard.revenue'), value: `₹${(stats?.revenue || 125000).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
          { label: t('admin.dashboard.activeDeliveries'), value: stats?.orders?.active || 12, icon: Truck, color: 'bg-amber-50 text-amber-600' },
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">{t('admin.dashboard.ordersOverTime')}</h3>
          <div className="h-48 flex items-end justify-around gap-1">
            {[45, 52, 48, 61, 55, 72, 68, 80, 75, 88, 82, 95].map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className="bg-blue-500 rounded-t w-full max-w-[30px]" style={{ height: `${v * 1.8}px` }} />
                <span className="text-xs text-gray-400">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold mb-4">{t('admin.dashboard.title')}</h3>
          <div className="space-y-4">
            {[
              { label: 'Users', farmers: stats?.users?.farmers || 10, consumers: stats?.users?.consumers || 30, buyers: stats?.users?.buyers || 10 },
            ].map(o => (
              <div key="users" className="space-y-2">
                <div className="flex justify-between text-sm"><span>{t('admin.dashboard.totalFarmers')}</span><span className="font-medium">{o.farmers}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(o.farmers / 60) * 100}%` }} /></div>
                <div className="flex justify-between text-sm"><span>{t('admin.dashboard.totalConsumers')}</span><span className="font-medium">{o.consumers}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(o.consumers / 60) * 100}%` }} /></div>
                <div className="flex justify-between text-sm"><span>{t('admin.dashboard.totalBuyers')}</span><span className="font-medium">{o.buyers}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(o.buyers / 60) * 100}%` }} /></div>
              </div>
            ))}
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('admin.dashboard.completedOrders')}</span><span className="font-medium">{stats?.orders?.completed || 35}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('admin.dashboard.cancellations')}</span><span className="font-medium text-red-600">{stats?.disputes?.total || 3}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('farmer.dashboard.stats.logisticsSaved')}</span><span className="font-medium text-green-600">₹28,500</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold mb-4">{t('admin.dashboard.recentOrders')}</h3>
        <div className="space-y-3">
          {[
            { action: 'New farmer registered', user: 'Kamla Devi', time: '2 hours ago', icon: '👨‍🌾' },
            { action: 'Order completed', user: '#101 - Hotel Fresh Picks', time: '3 hours ago', icon: '✅' },
            { action: 'Dispute reported', user: '#108 - Consumer complaint', time: '5 hours ago', icon: '⚠️' },
            { action: 'Clubbing savings', user: '₹190 saved on 3 orders', time: '6 hours ago', icon: '💰' },
            { action: 'New B2B buyer', user: 'Spice Kitchen registered', time: '1 day ago', icon: '🏪' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{a.action}</p>
                <p className="text-xs text-gray-400">{a.user}</p>
              </div>
              <span className="text-xs text-gray-400">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
