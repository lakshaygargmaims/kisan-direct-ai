import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { segmentToLabel, getDashboardPath, UserRole } from '../lib/navigation';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation();
  const segments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on dashboard (it's the root of each section)
  if (segments.length <= 1) return null;

  const dashboardPath = getDashboardPath(segments[0] as UserRole) || '/';

  // Build breadcrumb items from URL segments
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += '/' + segment;
    const label = segmentToLabel(segment, t);
    if (label) {
      items.push({ label, path: currentPath });
    }
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 overflow-x-auto">
      <Link
        to={dashboardPath}
        className="flex items-center gap-1 hover:text-green-600 transition flex-shrink-0"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>{t('nav.dashboard')}</span>
      </Link>

      {items.map((item, idx) => (
        <span key={item.path} className="flex items-center gap-1 flex-shrink-0">
          <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {idx === items.length - 1 ? (
            // Current page — not a link
            <span className="font-medium text-gray-800">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-green-600 transition">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
