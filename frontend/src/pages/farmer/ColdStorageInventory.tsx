import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Snowflake, QrCode, TrendingUp, CalendarClock, Package, Wallet } from 'lucide-react';
import { coldStorageApi, StoredBatch } from '../../services/coldStorageApi';

const STATUS_STYLE: Record<string, string> = {
  STORED: 'bg-green-50 text-green-700',
  PARTIALLY_LISTED: 'bg-blue-50 text-blue-700',
  PARTIALLY_SOLD: 'bg-indigo-50 text-indigo-700',
  SOLD_OUT: 'bg-gray-100 text-gray-500',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
  RELEASE_REQUESTED: 'bg-amber-50 text-amber-700',
};

export default function ColdStorageInventory() {
  const [batches, setBatches] = useState<StoredBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoredBatch | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // sell form state
  const [sellQty, setSellQty] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    coldStorageApi.getBatches()
      .then((d) => setBatches(d.batches))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openBatch = async (b: StoredBatch) => {
    setSelected(b);
    setSellQty(''); setSellPrice('');
    setInsightLoading(true);
    try {
      const fresh = await coldStorageApi.getBatch(b.id);
      setSelected(fresh);
    } catch (e: any) { toast.error(e.message); }
    finally { setInsightLoading(false); }
  };

  const sellNow = async () => {
    if (!selected) return;
    const qty = parseFloat(sellQty);
    const price = parseFloat(sellPrice);
    if (!qty || qty <= 0 || !price || price <= 0) { toast.error('Enter valid quantity and price'); return; }
    setBusy(true);
    try {
      await coldStorageApi.sellFromBatch(selected.id, { quantityKg: qty, pricePerKg: price });
      toast.success(`Listed ${qty} kg on the marketplace!`);
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const extend = async (b: StoredBatch) => {
    const extra = prompt('Extend storage by how many days?', '15');
    const extraDays = parseInt(extra || '');
    if (!extraDays || extraDays <= 0) return;
    setBusy(true);
    try {
      const r = await coldStorageApi.extendStorage(b.id, extraDays);
      toast.success(`Extended ${extraDays} days — ₹${r.paid.toLocaleString('en-IN')} charged (demo)`);
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const withdraw = async (b: StoredBatch) => {
    if (!confirm(`Withdraw ${b.currentQtyKg} kg of ${b.productName} from ${b.facility.name}?`)) return;
    setBusy(true);
    try {
      await coldStorageApi.withdrawBatch(b.id);
      toast.success('Product withdrawn. Capacity released.');
      setSelected(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading stored products…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧊 My Stored Products</h1>
          <p className="text-sm text-gray-500 mt-1">Track batches, get AI selling insights, and sell when the time is right.</p>
        </div>
        <Link to="/farmer/cold-storage" className="px-4 py-2 rounded-xl bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800">+ Store More</Link>
      </div>

      {batches.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-5xl mb-3">🧊</div>
          <p className="text-gray-500 mb-4">Nothing stored yet. Book cold storage to protect your harvest and sell later at better prices.</p>
          <Link to="/farmer/cold-storage" className="inline-block px-5 py-2.5 rounded-xl bg-cyan-700 text-white text-sm font-semibold">Find Cold Storage</Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {batches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-gray-900">{b.productName} <span className="text-xs font-mono text-cyan-700">{b.batchCode}</span></div>
                <div className="text-xs text-gray-500">{b.facility.name} • {b.facility.city}</div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                {b.status === 'STORED' ? '🟢 Safely Stored' : b.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400">Quantity</div>
                <div className="font-bold text-gray-800">{b.currentQtyKg ?? 0} kg</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400">Days stored</div>
                <div className="font-bold text-gray-800">{b.daysStored ?? 0}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-gray-400">Days left</div>
                <div className="font-bold text-gray-800">{b.daysRemaining ?? 0}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <div className="text-gray-400">Cost so far</div>
                <div className="font-bold text-amber-700">₹{(b.costAccrued ?? 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1">
              <CalendarClock className="w-3 h-3" /> Stored until {new Date(b.expectedEndDate).toLocaleDateString('en-IN')}
              {b.tempRequired && <span className="ml-2">• {b.tempRequired}</span>}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => openBatch(b)} className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800">AI Insight & Sell</button>
              <button onClick={() => extend(b)} disabled={busy} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-cyan-400">Extend</button>
              <button onClick={() => withdraw(b)} disabled={busy} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-red-300">Withdraw</button>
              <a href={`/api/cold-storage/trace/${b.qrToken}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-cyan-400 inline-flex items-center gap-1">
                <QrCode className="w-3 h-3" /> QR
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.productName}</h2>
                <p className="text-xs font-mono text-cyan-700">{selected.batchCode}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Current quantity</div><div className="font-bold">{selected.currentQtyKg ?? 0} kg</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Available to sell</div><div className="font-bold">{selected.availableToSell ?? 0} kg</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Quality grade</div><div className="font-bold">{selected.qualityGrade}</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400">Temp requirement</div><div className="font-bold text-xs">{selected.tempRequired || '—'}</div></div>
            </div>

            {/* AI Selling Insight */}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 space-y-3">
              <div className="font-bold text-cyan-900 flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4" /> AI Selling Insight</div>
              {insightLoading ? (
                <div className="text-sm text-gray-500">Analyzing market data…</div>
              ) : selected.insight ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Current market price</div>
                      <div className="text-lg font-extrabold text-gray-900">₹{selected.insight.currentMarketPrice}/kg</div>
                      <div className="text-[10px] text-gray-400">Source: {selected.insight.priceDataSource.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Estimated price range</div>
                      <div className="text-lg font-extrabold text-cyan-800">₹{selected.insight.estimatedPriceRange.low}–₹{selected.insight.estimatedPriceRange.high}/kg</div>
                      <div className="text-[10px] text-gray-400">Confidence {selected.insight.confidence}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white rounded-xl p-3">
                      <div className="font-bold text-gray-700 mb-1">Sell Now</div>
                      <div>Gross: ₹{selected.insight.sellNow.grossRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-gray-400">Storage cost: ₹0</div>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <div className="font-bold text-gray-700 mb-1">Wait ~15 days</div>
                      <div>Est. gross: ₹{selected.insight.wait15Days.grossRevenueEstimate.toLocaleString('en-IN')}</div>
                      <div className="text-gray-400">Extra storage: ₹{selected.insight.wait15Days.extraStorageCost.toLocaleString('en-IN')}</div>
                      <div className={selected.insight.wait15Days.estimatedNetGain >= 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                        Est. net gain: ₹{selected.insight.wait15Days.estimatedNetGain.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 italic">{selected.insight.disclaimer}</p>
                </>
              ) : (
                <div className="text-sm text-gray-400">Insight unavailable.</div>
              )}
            </div>

            {/* Sell form */}
            <div className="space-y-3 border-t pt-4">
              <div className="font-bold text-gray-900 text-sm">Sell from Storage</div>
              {(selected.availableToSell ?? 0) <= 0 ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  This batch's stock is fully listed on the marketplace — no more to list here. Wait for buyer orders, or withdraw remaining stock once listings are sold.
                </div>
              ) : (
              <>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="text-gray-600 text-xs">Quantity (kg) — max {selected.availableToSell}</span>
                  <input type="number" value={sellQty} onChange={(e) => setSellQty(e.target.value)} max={selected.availableToSell} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
                </label>
                <label className="text-sm">
                  <span className="text-gray-600 text-xs">Price per kg (₹)</span>
                  <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder={String(selected.insight?.currentMarketPrice || '')} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
                </label>
              </div>
              <button onClick={sellNow} disabled={busy || !sellQty || !sellPrice} className="w-full py-2.5 rounded-xl bg-green-700 text-white font-bold hover:bg-green-800 disabled:opacity-40 text-sm">
                {busy ? 'Listing…' : `List ${sellQty || 0} kg for Sale`}
              </button>
              <p className="text-[11px] text-gray-400">Creates a marketplace listing backed by this batch. Buyers see the batch ID for traceability.</p>
              </>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => extend(selected)} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold">Extend Storage</button>
              <button onClick={() => withdraw(selected)} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-sm font-semibold">Withdraw Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
