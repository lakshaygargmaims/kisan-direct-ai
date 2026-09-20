import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useSocketContext } from '../hooks/useSocket';
import {
  Sprout, Bell, LogOut, Menu, X, Search, ChevronRight, Home
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import { useNotifications, useMarkNotificationRead } from '../hooks/queries';
import CommandPalette from '../components/CommandPalette';
import Breadcrumbs from '../components/Breadcrumbs';
import PageLoader from '../components/PageLoader';
import { getNavEntriesForRole, UserRole, NavEntry } from '../lib/navigation';



export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { connected } = useSocketContext();
  const { t } = useTranslation();
  const { data: notifData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const notifications: any[] = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount ?? notifications.filter((n: any) => !n.isRead).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItemsRaw: NavEntry[] = getNavEntriesForRole((user?.role || 'CONSUMER') as UserRole);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <CommandPalette />
      <PageLoader />
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-30">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="h-7 w-7 text-green-600" />
            <span className="text-lg font-bold text-green-800">KisanDirect</span>
          </Link>
          <div className="mt-3 px-3 py-2 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">{user?.role?.replace('_', ' ')}</p>
            <p className="text-sm font-semibold text-green-800 truncate">{user?.name}</p>
          </div>
          <LanguageSelector />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItemsRaw.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition">
            <LogOut className="h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 w-64 h-full bg-white shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2">
                <Sprout className="h-6 w-6 text-green-600" />
                <span className="font-bold text-green-800">KisanDirect</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="p-3 space-y-1">
              {navItemsRaw.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <Icon className="h-5 w-5" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 mt-4">
                <LogOut className="h-5 w-5" />
                {t('nav.logout')}
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 flex-1 max-w-md mx-4">
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="relative w-full flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg text-sm text-gray-400 hover:bg-gray-100 transition cursor-pointer">
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">{t('common.search') + '...'} </span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] bg-white border rounded">⌘K</kbd>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {/* WebSocket connection indicator */}
            <div className="flex items-center gap-1.5" title={connected ? 'Live updates active' : 'Reconnecting...'}>
              <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`} />
              <span className="text-xs text-gray-400 hidden lg:inline">{connected ? 'Live' : 'Offline'}</span>
            </div>
            <div ref={notifRef} className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{t('nav.notifications') || 'Notifications'}</h3>
                    {unreadCount > 0 && (
                      <button onClick={() => { notifications.filter((n: any) => !n.isRead).forEach((n: any) => markRead.mutate(n.id)); setNotifOpen(false); }}
                        className="text-xs text-green-600 hover:text-green-700">Mark all read</button>
                    )}
                  </div>
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="h-8 w-8 text-gray-300 mx-auto" />
                        <p className="mt-2 text-sm text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <button key={n.id}
                          onClick={() => { if (!n.isRead) markRead.mutate(n.id); setNotifOpen(false); }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!n.isRead ? 'bg-green-50/50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-green-500' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-700">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm font-medium hidden md:block">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
