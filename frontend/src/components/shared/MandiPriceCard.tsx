import { useState, useEffect } from 'react';

interface MandiPrice {
  commodity: string;
  variety: string;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
}

interface MandiPriceCardProps {
  productName: string;
  kisanDirectPrice?: number;
  compact?: boolean;
}

export function MandiPriceCard({ productName, kisanDirectPrice, compact = false }: MandiPriceCardProps) {
  const [mandiData, setMandiData] = useState<{
    mandiPrices: MandiPrice[];
    stats: { avgModalPrice: number; minPrice: number; maxPrice: number; marketsFound: number; statesFound: string[] };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/mandi/compare/${encodeURIComponent(productName)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setMandiData(d.data);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [productName]);

  if (loading) {
    return (
      <div style={{
        background: 'white', borderRadius: '12px', padding: compact ? '12px' : '16px',
        border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280',
      }}>
        📊 Mandi prices load ho rahe hain...
      </div>
    );
  }

  if (error || !mandiData || !mandiData.mandiPrices || mandiData.mandiPrices.length === 0) {
    return null; // Don't show if no data
  }

  const { stats, mandiPrices: prices } = mandiData;
  const priceDiff = kisanDirectPrice ? kisanDirectPrice - stats.avgModalPrice : 0;
  const diffPercent = kisanDirectPrice ? Math.round((priceDiff / stats.avgModalPrice) * 100) : 0;

  if (compact) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
        borderRadius: '10px', padding: '12px 16px',
        border: '1px solid #f59e0b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <div>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 500 }}>APMC Mandi Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#92400e' }}>
                ₹{stats.avgModalPrice}/{prices[0]?.unit || 'kg'}
              </div>
            </div>
          </div>
          {kisanDirectPrice && (
            <div style={{
              background: diffPercent >= 0 ? '#dcfce7' : '#fef2f2',
              color: diffPercent >= 0 ? '#166534' : '#991b1b',
              borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600,
            }}>
              {diffPercent >= 0 ? '↑' : '↓'} {Math.abs(diffPercent)}% {diffPercent >= 0 ? 'higher' : 'lower'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid #e5e7eb', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        padding: '16px 20px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>📊 APMC Mandi Prices</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Real market rates from {stats.marketsFound} markets across {stats.statesFound?.length || 0} states
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: '8px',
            padding: '6px 12px', fontSize: '11px',
          }}>
            {mandiData.mandiPrices[0]?.date || 'Today'}
          </div>
        </div>
      </div>

      {/* KisanDirect vs Mandi comparison */}
      {kisanDirectPrice && (
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>APMC Average</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>₹{stats.avgModalPrice}</div>
            </div>
            <div style={{ fontSize: '24px', color: '#d1d5db' }}>vs</div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KisanDirect Price</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a' }}>₹{kisanDirectPrice}</div>
            </div>
            <div style={{
              background: diffPercent >= 0 ? '#dcfce7' : '#fef2f2',
              color: diffPercent >= 0 ? '#166534' : '#991b1b',
              borderRadius: '10px', padding: '8px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>
                {diffPercent >= 0 ? '+' : ''}{diffPercent}%
              </div>
              <div style={{ fontSize: '10px' }}>
                {diffPercent >= 0 ? 'Better for Farmer' : 'Better for Buyer'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market-wise prices */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
          Market-wise Prices ({prices.length} markets)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {prices.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: '8px',
              background: i === 0 ? '#f0fdf4' : '#f9fafb',
              border: i === 0 ? '1px solid #bbf7d0' : '1px solid #f3f4f6',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                  {p.market}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {p.variety} • {p.state}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                  ₹{p.modalPrice}/{p.unit}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  ₹{p.minPrice} – ₹{p.maxPrice}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid #f3f4f6',
        fontSize: '11px', color: '#9ca3af', background: '#fafafa',
      }}>
        ℹ️ Prices are indicative APMC mandi rates. Actual transaction prices may vary based on quality, quantity, and negotiation.
        Source: Agricultural Marketing Division, Government of India.
      </div>
    </div>
  );
}
