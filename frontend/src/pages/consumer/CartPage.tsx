import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  pricePerKg: number;
  unit?: string;
  quantity: number;
  farmerName: string;
  category: string;
  icon: string;
}

const DEMO_CART: CartItem[] = [
  { id: '1', name: 'Tomato', pricePerKg: 28, quantity: 50, farmerName: 'Rajesh Farm', category: 'Vegetables', icon: '🍅' },
  { id: '2', name: 'Onion', pricePerKg: 22, quantity: 30, farmerName: 'Singh Agro', category: 'Vegetables', icon: '🧅' },
  { id: '3', name: 'Milk', pricePerKg: 55, unit: 'L', quantity: 10, farmerName: 'Prasad Dairy', category: 'Dairy', icon: '🥛' },
];

export default function CartPage() {
  const { t } = useTranslation();
  const [cart, setCart] = useState<CartItem[]>(DEMO_CART);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.pricePerKg * item.quantity, 0);
  const advance = total * 0.2;

  const removeItem = (id: string) => setCart(cart.filter(i => i.id !== id));

  const handleCheckout = async () => {
    setChecking(true);
    try {
      await api.createOrder({
        productId: cart[0]?.id || 'demo',
        quantity: cart[0]?.quantity || 10,
        deliveryAddress: '12 MG Road, South Delhi',
        deliveryLatitude: 28.5245,
        deliveryLongitude: 77.2066,
      });
      await new Promise(r => setTimeout(r, 1000));
      navigate('/consumer/orders');
    } catch {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/consumer/marketplace" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')} {t('nav.marketplace')}
      </Link>

      <h1 className="text-2xl font-bold">{t('consumer.cart.title')}</h1>

      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">{t('consumer.cart.empty')}</h3>
          <Link to="/consumer/marketplace" className="inline-block mt-4 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">
            {t('consumer.cart.addItem')}
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.farmerName} • {item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{item.pricePerKg}/{item.unit || 'kg'} × {item.quantity}</p>
                  <p className="text-green-700 font-bold">₹{(item.pricePerKg * item.quantity).toLocaleString()}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5 h-fit sticky top-20">
            <h3 className="font-semibold mb-4">{t('common.total')}</h3>
            <div className="space-y-2 text-sm">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} ({item.quantity} {item.unit || 'kg'})</span>
                  <span>₹{(item.pricePerKg * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between"><span>{t('consumer.cart.subtotal')}</span><span>₹{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>{t('payment.platformFee')}</span><span>₹{(total * 0.025).toFixed(0)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-1"><span>{t('common.total')}</span><span>₹{(total * 1.025).toFixed(0)}</span></div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 mt-4 text-sm">
              <p className="text-green-800 font-medium">{t('consumer.cart.advance20')}</p>
              <p className="text-2xl font-bold text-green-700">₹{advance.toFixed(0)}</p>
              <p className="text-xs text-green-600 mt-1">{t('payment.remaining')} ₹{(total - advance).toFixed(0)} payable on delivery</p>
            </div>

            <button onClick={handleCheckout} disabled={checking}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
              <CreditCard className="h-5 w-5" />
              {checking ? '...' : `${t('payment.advance')} ₹${advance.toFixed(0)}`}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">{t('payment.demoMode')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
