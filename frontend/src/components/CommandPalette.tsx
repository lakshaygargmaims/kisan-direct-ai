import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { getPaletteEntries, getDashboardPath, UserRole } from '../lib/navigation';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const role: UserRole = (user?.role || 'CONSUMER') as UserRole;

  // All entries for this role, ordered
  const entries = useMemo(() => getPaletteEntries(role), [role]);

  // Filter entries based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(e =>
      t(e.labelKey).toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q) ||
      e.keywords.some(k => k.includes(q))
    );
  }, [entries, query, t]);

  // Group by section
  const grouped = useMemo(() => {
    const groups: Record<string, typeof entries> = {};
    for (const entry of filtered) {
      if (!groups[entry.section]) groups[entry.section] = [];
      groups[entry.section].push(entry);
    }
    return groups;
  }, [filtered]);

  const flatFiltered = filtered;

  // Keyboard shortcut: Cmd+K / Ctrl+K + custom event from header button
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const customHandler = () => {
      setOpen(prev => !prev);
      setQuery('');
      setSelectedIndex(0);
    };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('open-command-palette', customHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('open-command-palette', customHandler);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
        e.preventDefault();
        navigateTo(flatFiltered[selectedIndex].path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatFiltered, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const navigateTo = (path: string) => {
    setOpen(false);
    setQuery('');
    if (path === '__logout') {
      logout();
      navigate('/');
    } else {
      navigate(path);
    }
  };

  if (!open) return null;

  let itemIndex = -1;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              placeholder="Search pages, features, actions..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {flatFiltered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No results for "{query}"</p>
              </div>
            ) : (
              Object.entries(grouped).map(([section, ents]) => (
                <div key={section}>
                  <div className="px-4 py-1.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{section}</p>
                  </div>
                  {ents.map(entry => {
                    itemIndex++;
                    const idx = itemIndex;
                    const isSelected = idx === selectedIndex;
                    const isCurrent = location.pathname === entry.path;
                    return (
                      <button
                        key={entry.path}
                        data-selected={isSelected}
                        onClick={() => navigateTo(entry.path)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                          isSelected ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                        } ${isCurrent ? 'font-semibold' : ''}`}
                      >
                        <span className="flex-1 text-left">{t(entry.labelKey)}</span>
                        {isCurrent && <span className="text-xs text-green-500">Current</span>}
                        {isSelected && <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>}
                      </button>
                    );
                  })}
                </div>
              ))
            )}

            {/* Logout action */}
            <div className="border-t mt-2 pt-2 px-4 py-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</p>
            </div>
            <button
              onClick={() => navigateTo('__logout')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6v1a3 3 0 01-3-3H6v1a2 2 0 01-2-2V8a2 2 0 012-2h10a2 2 0 012 2v1" />
              </svg>
              <span>{t('nav.logout')}</span>
            </button>
          </div>

          {/* Footer hints */}
          <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">↵</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
