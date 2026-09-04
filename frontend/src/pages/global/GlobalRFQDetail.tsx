import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Users, Truck, FileText, Shield, AlertTriangle, Package } from 'lucide-react';
import { getRFQ, getRFQMatches, getShippingEstimates, runAggregation } from '../../services/globalTradeApi';

export default function GlobalRFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [shipping, setShipping] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'shipping' | 'aggregation'>('overview');

  useEffect(() => {
    if (id) loadRFQDetails();
  }, [id]);

  const loadRFQDetails = async () => {
    if (!id) return;
    try {
      const [rfqRes, matchRes, shipRes] = await Promise.allSettled([
        getRFQ(id),
        getRFQMatches(id).catch(() => null),
        getShippingEstimates(id).catch(() => null),
      ]);
      if (rfqRes.status === 'fulfilled') {
        const data: any = rfqRes.value;
        setRfq(data?.data || data);
      }
      if (matchRes.status === 'fulfilled' && matchRes.value) {
        const data: any = matchRes.value;
        setMatches(data?.data?.matches || data?.matches || []);
      }
      if (shipRes.status === 'fulfilled' && shipRes.value) {
        const data: any = shipRes.value;
        setShipping(data?.data?.estimates || data?.estimates || []);
      }
    } catch (err) {
      console.error('Failed to load RFQ', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">RFQ not found</p>
      </div>
    );
  }

  const getMatchLabel = (score: number) => {
    if (score >= 90) return { label: 'Excellent Match', color: 'text-emerald-700 bg-emerald-100' };
    if (score >= 75) return { label: 'Strong Match', color: 'text-blue-700 bg-blue-100' };
    if (score >= 60) return { label: 'Possible Match', color: 'text-amber-700 bg-amber-100' };
    return { label: 'Weak Match', color: 'text-red-700 bg-red-100' };
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ', SAR: '﷼', JPY: '¥', AUD: 'A$', CNY: '¥' };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button onClick={() => navigate('/global/rfqs')} className="flex items-center gap-2 text-teal-200 hover:text-white mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to RFQs
          </button>
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-teal-300" />
            <div>
              <h1 className="text-2xl font-bold">{rfq.productRequired}</h1>
              <p className="text-teal-200 mt-1">
                {rfq.requiredQuantity?.toLocaleString()} {rfq.unit} → {rfq.destinationCity ? `${rfq.destinationCity}, ` : ''}{rfq.destinationCountry}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border mb-6">
          {[
            { key: 'overview', label: 'Overview', icon: FileText },
            { key: 'matches', label: `Supplier Matches (${matches.length})`, icon: Users },
            { key: 'shipping', label: `Shipping (${shipping.length})`, icon: Truck },
            { key: 'aggregation', label: 'Supply Aggregation', icon: Package },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition flex-1 justify-center ${
                activeTab === tab.key ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-gray-900 mb-4">RFQ Details</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Product', rfq.productRequired],
                  ['Quantity', `${rfq.requiredQuantity?.toLocaleString()} ${rfq.unit}`],
                  ['Destination', `${rfq.destinationCity ? rfq.destinationCity + ', ' : ''}${rfq.destinationCountry}`],
                  ['Port', rfq.destinationPort || 'Not specified'],
                  ['Timeline', rfq.deliveryTimeline || 'Flexible'],
                  ['Quality', rfq.qualityRequirements || 'Standard'],
                  ['Packaging', rfq.packagingRequirements || 'Standard'],
                  ['Cold Chain', rfq.coldChainRequired ? 'Yes ❄️' : 'No'],
                  ['Status', rfq.status],
                  ['Created', new Date(rfq.createdAt).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Pricing</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Price</span>
                  <span className="font-medium text-gray-900">{rfq.targetPrice ? formatCurrency(rfq.targetPrice, rfq.preferredCurrency) : 'Open'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-medium text-gray-900">{rfq.preferredCurrency}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>AI Status:</strong> {matches.length > 0 ? `${matches.length} suppliers found` : 'Searching for suppliers...'}
              </div>

              {rfq.additionalNotes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <strong>Notes:</strong> {rfq.additionalNotes}
                </div>
              )}

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <Shield className="w-4 h-4 inline mr-1" />
                Export feasibility shown is an initial assessment. Final verification by authorized partners required.
              </div>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">AI is searching for matching suppliers...</p>
                <p className="text-gray-400 text-sm mt-2">Results typically appear within a few seconds</p>
              </div>
            ) : (
              matches.map((match: any) => {
                const ml = getMatchLabel(match.matchScore);
                return (
                  <div key={match.id} className="bg-white rounded-xl border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {match.user?.name || match.farmerName || `Farmer ${match.farmerId?.slice(0, 8)}`}
                        </h4>
                        <p className="text-sm text-gray-500">{match.user?.location || 'India'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${ml.color}`}>{ml.label}</span>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(match.matchScore)}%</p>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-4">
                      {[
                        ['Product', match.productScore],
                        ['Quantity', match.quantityScore],
                        ['Quality', match.qualityScore],
                        ['Timeline', match.timelineScore],
                        ['Readiness', match.readinessScore],
                        ['Location', match.locationScore],
                        ['Reliability', match.reliabilityScore],
                      ].map(([label, score]) => (
                        <div key={label as string} className="text-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${score}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-500">{label}</p>
                          <p className="text-xs font-bold">{Math.round(score as number)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            {shipping.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No shipping estimates yet</p>
              </div>
            ) : (
              shipping.map((s: any) => (
                <div key={s.id} className="bg-white rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <h4 className="font-bold text-gray-900">{s.shippingMethod?.replace(/_/g, ' ')}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{s.transitDays}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                    {[
                      ['Packaging', s.packagingCost],
                      ['Inland Transport', s.inlandTransport],
                      ['Handling', s.handlingCost],
                      ['Freight', s.freightCost],
                      ['Insurance', s.insuranceCost],
                      ['Documentation', s.documentationCost],
                    ].map(([label, cost]) => (
                      <div key={label as string}>
                        <p className="text-gray-400 text-xs">{label}</p>
                        <p className="font-medium">{formatCurrency(cost as number, s.currency)}</p>
                      </div>
                    ))}
                    <div className="col-span-2 md:col-span-5 pt-3 border-t flex justify-between items-center">
                      <span className="font-bold text-gray-900">Estimated Total</span>
                      <span className="text-xl font-bold text-blue-700">{formatCurrency(s.totalEstimate, s.currency)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                    <AlertTriangle className="w-3 h-3" />
                    Data Source: {s.dataSource || 'DEMO_SIMULATED'} — Final cost may vary based on shipment size, route, and carrier quote.
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Aggregation Tab */}
        {activeTab === 'aggregation' && (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Supply Aggregation</p>
            <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
              When a single supplier cannot fulfill the entire order, AI will automatically identify and aggregate supply from multiple farmers/FPOs.
            </p>
            {matches.length >= 3 && (
              <button
                onClick={async () => {
                  try {
                    const data: any = await runAggregation(id!);
                    alert(data?.message || 'Aggregation proposal created!');
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
              >
                Generate Aggregation Proposal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
