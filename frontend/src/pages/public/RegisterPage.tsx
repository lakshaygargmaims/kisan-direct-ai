import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '../../store/auth';
import { useTranslation } from 'react-i18next';
import { Sprout, Mail, Lock, User, Phone } from 'lucide-react';
import { UserRole } from '../../types';

const ROLES: { value: UserRole; labelKey: string; emoji: string; descKey: string }[] = [
  { value: 'CONSUMER', labelKey: 'auth.register.consumerDesc', emoji: '🛒', descKey: 'auth.register.consumerDesc' },
  { value: 'FARMER', labelKey: 'auth.register.farmerDesc', emoji: '👨‍🌾', descKey: 'auth.register.farmerDesc' },
  { value: 'B2B_BUYER', labelKey: 'auth.register.buyerDesc', emoji: '🏪', descKey: 'auth.register.buyerDesc' },
];

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'CONSUMER' as UserRole });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      const user = useAuthStore.getState().user;
      if (user) navigate(getDashboardPath(user.role));
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Sprout className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-green-800">{t('app.name')}</span>
          </Link>
          <h1 className="text-2xl font-bold">{t('auth.register.title')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.register.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('auth.register.role')}</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-3 rounded-lg border text-center transition ${
                      form.role === r.value ? 'border-green-500 bg-green-50 ring-2 ring-green-500' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <span className="text-2xl">{r.emoji}</span>
                    <p className="text-sm font-medium mt-1">{r.labelKey === 'auth.register.consumerDesc' ? t('auth.login.consumer') : r.labelKey === 'auth.register.farmerDesc' ? t('auth.login.farmer') : t('auth.login.buyer')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t(r.descKey)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your full name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+91-XXXXXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Min 6 characters" minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
              {isLoading ? '...' : t('auth.register.signUp')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          {t('auth.register.hasAccount')} <Link to="/login" className="text-green-600 font-medium hover:underline">{t('auth.register.signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
