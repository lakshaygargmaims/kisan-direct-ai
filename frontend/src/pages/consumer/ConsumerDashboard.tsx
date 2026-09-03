import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useOrders, useNotifications } from '../../hooks/queries';
import { useSocketEvent } from '../../hooks/useSocket';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart, Package, MapPin, Bell, Star, Truck,
} from 'lucide-react';

export default function ConsumerDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const { data: ordersData, refetch: refetchOrders } = useOrders({ limit: '5' });
  const { data: notifData } = useNotifications({ limit: '5' });

  const recentOrders = ordersData?.orders || [];
  const total = ordersData?.total || 0;

  useSocketEvent('order:status-changed', useCallback(() => {
    refetchOrders();
  }, [refetchOrders]));

  useSocketEvent('order:cancelled', useCallback(() => {
    refetchOrders();
  }, [refetchOrders]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('consumer.dashboard.welcome', { name: user?.name })} 👋</h1>
          <p className="text-gray-500">{t('consumer.dashboard.subtitle')}</p>
        </div>
        <Link to="/consumer/marketplace"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 justify-center">
          <ShoppingCart className="h-4 w-4" />
          {t('consumer.dashboard.browseMarketplace')}
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('consumer.dashboard.totalOrders'), value: total, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: t('consumer.dashboard.activeOrders'), value: recentOrders.filter((o: any) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length, icon: Truck, color: 'bg-green-50 text-green-600' },
          { label: t('consumer.dashboard.savedFarmers'), value: 3, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
          { label: t('consumer.dashboard.notificationsCount'), value: notifData?.unreadCount || 0, icon: Bell, color: 'bg-purple-50 text-purple-600' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">{t('consumer.dashboard.recentOrders')}</h2>
            <Link to="/consumer/orders" className="text-sm text-green-600 hover:underline">{t('common.viewAll')}</Link>
          </div>
          <div className="p-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('consumer.orders.noOrders')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order: any) => (
                  <Link key={order.id} to={`/consumer/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{order.product?.name || 'Product'}</p>
                        <p className="text-xs text-gray-400">{order.quantity} {order.product?.unit || 'kg'} • ₹{order.totalAmount}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h2 className="font-semibold mb-3">{t('consumer.dashboard.quickActions')}</h2>
            <div className="space-y-2">
              {[
                { label: t('consumer.dashboard.findFarmers'), path: '/consumer/farmers-map', icon: MapPin, color: 'text-blue-600' },
                { label: t('consumer.dashboard.browseMarketplace'), path: '/consumer/marketplace', icon: ShoppingCart, color: 'text-green-600' },
                { label: t('consumer.dashboard.trackDelivery'), path: '/consumer/orders', icon: Truck, color: 'text-purple-600' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.path} to={action.path}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h2 className="font-semibold mb-3">{t('consumer.dashboard.recentNotifications')}</h2>
            <div className="space-y-2">
              {(notifData?.notifications || []).slice(0, 4).map((n: any) => (
                <div key={n.id} className={`p-2.5 rounded-lg text-sm ${n.isRead ? 'bg-gray-50' : 'bg-green-50'}`}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              ))}
              {(!notifData?.notifications || notifData.notifications.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">{t('notifications.noNotifications')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Price Transparency Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-2">💡 {t('consumer.dashboard.priceTransparency')}</h3>
        <p className="text-sm text-green-700 mb-3">{t('consumer.dashboard.priceTransparencyDesc')}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="bg-white px-3 py-1.5 rounded-lg border">{t('consumer.dashboard.farmer')}: <strong>83%</strong></span>
          <span className="bg-white px-3 py-1.5 rounded-lg border">{t('consumer.dashboard.logistics')}: <strong>10%</strong></span>
          <span className="bg-white px-3 py-1.5 rounded-lg border">{t('consumer.dashboard.platform')}: <strong>2.5%</strong></span>
          <span className="bg-white px-3 py-1.5 rounded-lg border">{t('consumer.dashboard.other')}: <strong>4.5%</strong></span>
        </div>
      </div>
    </div>
  );
}
