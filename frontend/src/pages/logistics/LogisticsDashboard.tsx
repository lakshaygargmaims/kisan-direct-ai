import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, Package, MapPin, Clock, CheckCircle, Route } from 'lucide-react';

export default function LogisticsDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('logistics.dashboard.title')}</h1>
      <p className="text-gray-500">{t('logistics.provider.demoMode')}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('logistics.dashboard.activeDeliveries'), value: '3', icon: Truck, color: 'bg-blue-50 text-blue-600' },
          { label: t('logistics.dashboard.completedToday'), value: '7', icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: t('logistics.dashboard.pendingPickups'), value: '2', icon: Package, color: 'bg-amber-50 text-amber-600' },
          { label: t('common.distance'), value: `142 ${t('common.km')}`, icon: Route, color: 'bg-purple-50 text-purple-600' },
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

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t('logistics.dashboard.activeDeliveries')}</h2>
          <Link to="/logistics/requests" className="text-sm text-green-600 hover:underline">{t('common.viewAll')}</Link>
        </div>
        <div className="space-y-3">
          {[
            { id: 'DEL-001', order: '#101', from: 'Rajesh Farm, Gurugram', to: 'Hotel Fresh Picks, CP', status: 'IN_TRANSIT', eta: '45 min', driver: 'Demo Driver' },
            { id: 'DEL-002', order: '#105', from: 'Rajesh Farm, Gurugram', to: 'Grand Plaza, South Delhi', status: 'PICKED_UP', eta: '60 min', driver: 'Demo Driver' },
            { id: 'DEL-003', order: '#108', from: 'Singh Agro, Faridabad', to: 'Fresh Mart, Noida', status: 'BOOKED', eta: '90 min', driver: 'Unassigned' },
          ].map(d => (
            <div key={d.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{d.id}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-700' :
                    d.status === 'PICKED_UP' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>{d.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{d.from} → {d.to}</p>
              </div>
              <div className="text-right text-sm">
                <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {d.eta}</p>
                <p className="text-gray-400 mt-1">{d.driver}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ {t('logistics.provider.demoMode')}</h3>
        <p className="text-sm text-blue-700">
          {t('logistics.provider.demoNote')}
        </p>
      </div>
    </div>
  );
}
