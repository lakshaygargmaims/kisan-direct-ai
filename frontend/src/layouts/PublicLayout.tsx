import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore, getDashboardPath } from '../store/auth';
import { Sprout, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

export default function PublicLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-green-800">KisanDirect <span className="text-green-500">AI</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              <LanguageSelector />
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-green-600">Home</Link>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-green-600">Login</Link>
              <Link to="/register" className="text-sm font-medium text-gray-600 hover:text-green-600">Register</Link>
              {user && (
                <button onClick={() => navigate(getDashboardPath(user.role))}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  Dashboard
                </button>
              )}
            </nav>

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
            <Link to="/" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/login" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>Register</Link>
            {user && (
              <button onClick={() => { navigate(getDashboardPath(user.role)); setMenuOpen(false); }}
                className="block w-full text-left py-2 text-sm text-green-600 font-medium">
                Dashboard
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="h-6 w-6 text-green-400" />
                <span className="text-lg font-bold text-white">KisanDirect AI</span>
              </div>
              <p className="text-sm text-gray-400">Direct Farm to Buyer platform. Fair pricing, smart logistics, AI-powered marketplace.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Platform</h3>
              <div className="space-y-2 text-sm">
                <Link to="/login" className="block hover:text-green-400">For Farmers</Link>
                <Link to="/login" className="block hover:text-green-400">For Buyers</Link>
                <Link to="/login" className="block hover:text-green-400">For Consumers</Link>
                <Link to="/login" className="block hover:text-green-400">For Logistics</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Solution</h3>
              <div className="space-y-2 text-sm">
                <span className="block">AI Price Discovery</span>
                <span className="block">Smart Order Clubbing</span>
                <span className="block">Geo-Logistics Engine</span>
                <span className="block">Transparent Payments</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">SIH 2024</h3>
              <p className="text-sm text-gray-400">Problem Statement PS26033. Eliminating middlemen for fair farmer earnings.</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            KisanDirect AI &copy; {new Date().getFullYear()} — SIH PS26033 Solution
          </div>
        </div>
      </footer>
    </div>
  );
}
