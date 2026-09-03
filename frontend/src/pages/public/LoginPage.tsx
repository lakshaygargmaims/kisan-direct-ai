import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '../../store/auth';
import { useTranslation } from 'react-i18next';
import { Sprout, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'consumer@demo.com', roleKey: 'auth.login.consumer', emoji: '🛒' },
  { email: 'farmer@demo.com', roleKey: 'auth.login.farmer', emoji: '👨‍🌾' },
  { email: 'fpo@demo.com', roleKey: 'auth.login.fpo', emoji: '🤝' },
  { email: 'buyer@demo.com', roleKey: 'auth.login.buyer', emoji: '🏪' },
  { email: 'logistics@demo.com', roleKey: 'auth.login.logistics', emoji: '🚚' },
  { email: 'admin@demo.com', roleKey: 'auth.login.admin', emoji: '⚙️' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user) navigate(getDashboardPath(user.role));
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setError('');
    try {
      await login(demoEmail, 'demo123');
      const user = useAuthStore.getState().user;
      if (user) navigate(getDashboardPath(user.role));
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
          <h1 className="text-2xl font-bold">{t('auth.login.title')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.login.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.login.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50">
              {isLoading ? '...' : t('auth.login.signIn')}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-400 text-center mb-3">{t('auth.login.quickDemo')}</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.email} onClick={() => quickLogin(acc.email)}
                  className="flex flex-col items-center p-2 rounded-lg border hover:bg-green-50 hover:border-green-200 transition text-center">
                  <span className="text-xl mb-1">{acc.emoji}</span>
                  <span className="text-xs font-medium">{t(acc.roleKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          {t('auth.login.noAccount')} <Link to="/register" className="text-green-600 font-medium hover:underline">{t('auth.login.register')}</Link>
        </p>
      </div>
    </div>
  );
}
