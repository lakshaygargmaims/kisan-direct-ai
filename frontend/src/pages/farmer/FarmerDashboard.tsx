import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/queries';
import { useSocketEvent } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/auth';
import { useTranslation } from 'react-i18next';import { TrendingUp, Package, DollarSign, ShoppingCart, Users, BarChart3,
  Zap, Truck, Star, Clock, Target, MapPin, Snowflake
} from 'lucide-react';
import DemandNearYou from '../../components/DemandNearYou';

export default function FarmerDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { data: ordersData, refetch } = useOrders({ limit: '5' });
  const recentOrders = ordersData?.orders || [];

  useSocketEvent('order:created', useCallback(() => refetch(), [refetch]));
  useSocketEvent('order:status-changed', useCallback(() => refetch(), [refetch]));
  useSocketEvent('order:cancelled', useCallback(() => refetch(), [refetch]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('farmer.dashboard.welcome', { name: user?.name })} 👨‍🌾</h1>
        <p className="text-gray-500">{t('farmer.dashboard.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('farmer.dashboard.stats.monthlySales'), value: '₹1,85,000', icon: DollarSign, color: 'bg-green-50 text-green-600', change: '+12%' },
          { label: t('farmer.dashboard.stats.totalOrders'), value: ordersData?.total || 42, icon: Package, color: 'bg-blue-50 text-blue-600', change: '+8' },
          { label: t('farmer.dashboard.stats.avgPrice'), value: '₹32', icon: TrendingUp, color: 'bg-purple-50 text-purple-600', change: '+₹3' },
          { label: t('farmer.dashboard.stats.logisticsSaved'), value: '₹4,200', icon: Truck, color: 'bg-amber-50 text-amber-600', change: '15%' },
          { label: t('farmer.dashboard.stats.repeatBuyers'), value: '18', icon: Users, color: 'bg-pink-50 text-pink-600', change: '+5' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <span className="text-xs text-green-600 font-medium">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">{t('farmer.dashboard.recentOrders')}</h2>
            <Link to="/farmer/orders" className="text-sm text-green-600 hover:underline">{t('common.viewAll')}</Link>
          </div>
          <div className="p-4 space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('farmer.orders.noOrders')}</p>
              </div>
            ) : recentOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{order.product?.name} • {order.quantity} {order.product?.unit || 'kg'}</p>
                    <p className="text-xs text-gray-400">{order.buyer?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{Number(order.totalAmount).toLocaleString()}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-purple-600" />
              AI Insights
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-purple-700 font-medium">🔥 {t('notifications.types.highDemand')}</p>
                <p className="text-gray-600">Tomato demand expected to increase 15% this week</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-green-700 font-medium">💡 {t('nav.priceAdvisor')}</p>
                <p className="text-gray-600">Current fair price: ₹28/kg. Your pricing is competitive and aligned with market trends.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-amber-700 font-medium">📦 {t('nav.clubbing')}</p>
                <p className="text-gray-600">3 orders can be clubbed, save ₹190</p>
              </div>
            </div>
          </div>

          <DemandNearYou />

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold mb-3">{t('farmer.dashboard.quickActions')}</h3>
            <div className="space-y-2">
              {[
                { label: t('farmer.products.addProduct'), path: '/farmer/products/add', icon: Target, color: 'text-green-600' },                 { label: 'Demand Map', path: '/farmer/demand-map', icon: MapPin, color: 'text-red-600' },
                 { label: '🧊 Cold Storage', path: '/farmer/cold-storage', icon: Snowflake, color: 'text-cyan-600' },
                { label: t('nav.clubbing'), path: '/farmer/clubbing', icon: TrendingUp, color: 'text-purple-600' },
                { label: t('nav.priceAdvisor'), path: '/farmer/price-advisor', icon: DollarSign, color: 'text-blue-600' },
                { label: t('farmer.products.title'), path: '/farmer/products', icon: Package, color: 'text-amber-600' },
                { label: t('nav.analytics'), path: '/farmer/analytics', icon: BarChart3, color: 'text-indigo-600' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.path} to={a.path}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition">
                    <Icon className={`h-5 w-5 ${a.color}`} />
                    <span className="text-sm font-medium">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Chart Placeholder */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold mb-4">{t('farmer.dashboard.stats.monthlySales')}</h3>
        <div className="h-48 flex items-end justify-around gap-2">
          {[45, 52, 48, 61, 55, 72, 68, 80, 75, 88, 82, 95].map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="bg-green-500 rounded-t-md w-full min-w-[30px]"
                style={{ height: `${val * 2}px`, opacity: 0.3 + (i * 0.06) }} />
              <span className="text-xs text-gray-400">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
