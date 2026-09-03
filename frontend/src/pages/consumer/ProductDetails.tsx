import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Star, MapPin, Truck, Shield, Clock, Leaf, ArrowLeft, ShoppingCart } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(10);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      api.getProduct(id).then(setProduct).catch(() => navigate('/consumer/marketplace')).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div>;
  if (!product) return null;

  const total = product.pricePerKg * quantity;
  const advance = total * 0.2;

  return (
    <div className="space-y-6">
      <Link to="/consumer/marketplace" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')} {t('nav.marketplace')}
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl h-80 flex items-center justify-center overflow-hidden">
            <span className="text-8xl">{product.category?.icon || '🌿'}</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {product.organicCertified && (
                <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <Leaf className="h-4 w-4" /> Organic
                </span>
              )}
            </div>
            <p className="text-gray-500">{product.farmer?.name || 'Farmer'}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-700">₹{product.pricePerKg}</span>
            <span className="text-gray-400">/{product.unit || 'kg'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">{t('common.available')}</p>
              <p className="font-semibold">{product.availableQuantity} {product.unit || 'kg'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">{t('consumer.productDetail.minimumOrder')}</p>
              <p className="font-semibold">{product.minOrderQuantity} {product.unit || 'kg'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">{t('consumer.productDetail.qualityGrade')}</p>
              <p className="font-semibold">{product.qualityGrade}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400">{t('common.rating')}</p>
              <p className="font-semibold flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                {Number(product.avgRating || 0).toFixed(1)}
              </p>
            </div>
          </div>

          {product.shelfLife && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {t('consumer.productDetail.shelfLife')}: {product.shelfLife} days
            </div>
          )}

          {product.deliveryRule && (
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" /> {t('nav.deliveryRules')}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-blue-700">
                <span>Max radius: {product.deliveryRule.maxDeliveryRadiusKm} {t('common.km')}</span>
                <span>Transit: ≤{product.deliveryRule.maximumTransitHours}h</span>
                <span>{t('consumer.productDetail.coldChain')}: {product.deliveryRule.coldChainRequired ? '✅' : '—'}</span>
                <span>Interstate: {product.deliveryRule.interstateAllowed ? '✅' : '—'}</span>
              </div>
            </div>
          )}

          {/* Order Section */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold mb-3">{t('common.submit')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">{t('common.quantity')} ({product.unit || 'kg'})</label>
                <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  min={product.minOrderQuantity} max={product.availableQuantity}
                  className="w-full mt-1 px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>{t('consumer.productDetail.productDetails')}</span><span>₹{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>{t('consumer.dashboard.platform')} (2.5%)</span><span>₹{(total * 0.025).toFixed(0)}</span></div>
                <div className="flex justify-between border-t pt-1 font-semibold"><span>{t('common.total')}</span><span>₹{(total * 1.025).toFixed(0)}</span></div>
                <div className="flex justify-between text-green-700"><span>{t('payment.advance')}</span><span>₹{advance.toFixed(0)}</span></div>
              </div>
              <button onClick={() => { setAddingToCart(true); setTimeout(() => navigate('/consumer/cart'), 500); }}
                disabled={addingToCart || quantity < product.minOrderQuantity}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                <ShoppingCart className="h-5 w-5" />
                {addingToCart ? '...' : t('consumer.marketplace.addToCart')}
              </button>
              <button className="w-full border border-green-600 text-green-700 py-3 rounded-lg font-medium hover:bg-green-50 transition">
                {t('consumer.marketplace.buyNow')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Farmer Info */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">{t('consumer.productDetail.farmer')}</h3>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center text-xl font-bold text-green-700">
            {product.farmer?.user?.name?.charAt(0)}
          </div>
          <div>              <p className="font-medium">{product.farmer?.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              NCR
              <span>•</span>
              <Shield className="h-3.5 w-3.5 text-green-500" />
              {t('trustScore.title')}: 85%
            </div>
          </div>
        </div>
      </div>

      {/* Price Transparency */}
      <div className="bg-green-50 rounded-xl p-5 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-3">💡 {t('consumer.dashboard.priceTransparency')}</h3>
        <div className="space-y-2 text-sm">
          {[
            { label: t('common.total'), amount: `₹${(total * 1.025).toFixed(0)}`, pct: '100%', color: 'text-gray-700' },
            { label: t('payment.farmerShare'), amount: `₹${(total * 0.85).toFixed(0)}`, pct: '83%', color: 'text-green-700' },
            { label: t('consumer.dashboard.logistics'), amount: `₹${(total * 0.075).toFixed(0)}`, pct: '7.5%', color: 'text-blue-700' },
            { label: t('payment.platformFee'), amount: `₹${(total * 0.025).toFixed(0)}`, pct: '2.5%', color: 'text-purple-700' },
          ].map(item => (
            <div key={item.label} className="flex justify-between">
              <span className={item.color}>{item.label}</span>
              <span className="font-medium">{item.amount} ({item.pct})</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-green-600 mt-3">{t('payment.demoMode')}</p>
      </div>
    </div>
  );
}
