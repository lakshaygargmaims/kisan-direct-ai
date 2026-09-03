import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const DEMO_DISPUTES = [
  { id: 'D001', order: '#108', reporter: 'Priya Sharma (Consumer)', reason: 'Quality issue', description: 'Tomatoes were not fresh as expected', status: 'PENDING', amount: '₹1,400', date: '2024-01-15' },
  { id: 'D002', order: '#112', reporter: 'Amit Patel (Consumer)', reason: 'Wrong quantity', description: 'Received 45kg instead of ordered 50kg', status: 'INVESTIGATING', amount: '₹140', date: '2024-01-14' },
  { id: 'D003', order: '#115', reporter: 'Rajesh Kumar (Farmer)', reason: 'Fake order', description: 'Buyer placed order and immediately cancelled', status: 'RESOLVED', amount: '₹0', date: '2024-01-12' },
];

export default function Disputes() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-amber-600" />
        {t('disputes.title')}
      </h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('disputes.status.open'), value: '1', color: 'text-yellow-600 bg-yellow-50' },
          { label: t('disputes.status.underReview'), value: '1', color: 'text-blue-600 bg-blue-50' },
          { label: t('disputes.status.resolved'), value: '1', color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {DEMO_DISPUTES.map(d => (
          <div key={d.id} className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium">{d.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    d.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>{t(`disputes.status.${d.status.toLowerCase()}`) || d.status}</span>
                  <span className="text-sm text-gray-400">{d.order}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1"><strong>{t('disputes.reason')}:</strong> {d.reason}</p>
                <p className="text-sm text-gray-500">{d.description}</p>
                <p className="text-sm font-medium text-red-600 mt-2">{d.amount}</p>
              </div>
              <div className="flex gap-2">
                {d.status !== 'RESOLVED' && (
                  <>
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
                      {t('common.resolve')}
                    </button>
                    <button className="border border-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
                      {t('disputes.status.underReview')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
