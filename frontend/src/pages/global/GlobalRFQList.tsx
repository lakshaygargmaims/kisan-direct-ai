import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Globe, Plus, Filter, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { getRFQs } from '../../services/globalTradeApi';

interface RFQ {
  id: string;
  productRequired: string;
  requiredQuantity: number;
  unit: string;
  destinationCountry: string;
  destinationCity?: string;
  status: string;
  deliveryTimeline?: string;
  createdAt: string;
  buyer?: { companyName: string; country: string };
  _count?: { matches: number; offers: number; aggregations: number };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  SUBMITTED: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  MATCHING: { label: 'AI Matching', color: 'text-purple-700', bg: 'bg-purple-100', icon: AlertCircle },
  OFFERS_RECEIVED: { label: 'Offers Received', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bg: 'bg-gray-100', icon: CheckCircle },
};

export default function GlobalRFQList() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadRFQs(); }, []);

  const loadRFQs = async () => {
    try {
      const res = await getRFQs();
      const items = res?.data?.rfqs || res?.rfqs || [];
      setRfqs(Array.isArray(items) ? items : []);
    } catch {
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? rfqs : rfqs.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-teal-300" />
                <h1 className="text-3xl font-bold">Global RFQs</h1>
              </div>
              <p className="text-teal-200 mt-2">Manage your international bulk purchase requests</p>
            </div>
            <button
              onClick={() => navigate('/global/rfq/new')}
              className="flex items-center gap-2 px-5 py-3 bg-white text-teal-800 rounded-lg hover:bg-teal-50 font-semibold transition"
            >
              <Plus className="w-5 h-5" /> New RFQ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'SUBMITTED', 'MATCHING', 'OFFERS_RECEIVED', 'ACCEPTED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === s ? 'bg-teal-600 text-white' : 'bg-white border text-gray-700 hover:border-teal-400'
              }`}>
              {s === 'all' ? 'All RFQs' : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No RFQs found</p>
            <button onClick={() => navigate('/global/rfq/new')}
              className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Create Your First RFQ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(rfq => {
              const status = STATUS_MAP[rfq.status] || STATUS_MAP.SUBMITTED;
              const StatusIcon = status.icon;
              return (
                <div key={rfq.id} className="bg-white rounded-xl border hover:shadow-md transition p-6 cursor-pointer"
                  onClick={() => navigate(`/global/rfq/${rfq.id}`)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{rfq.productRequired}</h3>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-400">Quantity</span>
                          <p className="font-medium">{rfq.requiredQuantity?.toLocaleString()} {rfq.unit}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Destination</span>
                          <p className="font-medium">{rfq.destinationCity ? `${rfq.destinationCity}, ` : ''}{rfq.destinationCountry}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Timeline</span>
                          <p className="font-medium">{rfq.deliveryTimeline || 'Flexible'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Created</span>
                          <p className="font-medium">{new Date(rfq.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {rfq._count && (
                        <div className="flex gap-4 mt-3 text-xs text-gray-500">
                          <span>{rfq._count.matches || 0} supplier matches</span>
                          <span>{rfq._count.offers || 0} offers</span>
                          <span>{rfq._count.aggregations || 0} aggregation proposals</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
