/**
 * Navigation Configuration — Single source of truth
 *
 * This module defines EVERY navigable route in the app. Consumers:
 * - DashboardLayout: renders sidebar nav items
 * - CommandPalette: renders searchable palette entries
 * - Breadcrumbs: resolves current page labels
 *
 * Adding a new page means adding ONE entry here. It automatically
 * appears in the sidebar, command palette, and breadcrumbs.
 */

import {
  LayoutDashboard, ShoppingCart, Package, Map, Sprout, ClipboardList,
  TrendingUp, Target, DollarSign, Landmark, BarChart3, Users, AlertTriangle,
  Settings, Truck, MapPin, Globe, FileText, Bell, LogOut, Menu, X, Search,
  ChevronRight, Home, Snowflake
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

/** One navigable entry — used by sidebar and command palette */
export interface NavEntry {
  /** Translation key for the label (e.g. 'nav.products') */
  labelKey: string;
  /** Route path (e.g. '/farmer/products') */
  path: string;
  /** Lucide icon component for sidebar */
  icon: React.ComponentType<{ className?: string }>;
  /** Section name for command palette grouping (e.g. 'Farmer', 'AI Tools') */
  section: string;
  /** Search keywords for command palette */
  keywords: string[];
}

/** Map: role → ordered list of nav entries */
export type NavConfig = Record<UserRole, NavEntry[]>;

/** Supported user roles */
export type UserRole = 'CONSUMER' | 'FARMER' | 'FPO' | 'B2B_BUYER' | 'LOGISTICS' | 'ADMIN';

// ── Route Groups ─────────────────────────────────────────────────────────────

const ALL_ROUTES: NavEntry[] = [
  // ── Shared across roles ──
  { labelKey: 'nav.dashboard', path: '__dashboard__', icon: LayoutDashboard, section: 'Pages', keywords: ['home', 'overview', 'main'] },

  // ── Consumer ──
  { labelKey: 'nav.marketplace', path: '/consumer/marketplace', icon: ShoppingCart, section: 'Consumer', keywords: ['shop', 'buy', 'products'] },
  { labelKey: 'nav.map', path: '/consumer/farmers-map', icon: Map, section: 'Consumer', keywords: ['farmers near me', 'map'] },
  { labelKey: 'nav.upcomingHarvests', path: '/consumer/upcoming-harvests', icon: Sprout, section: 'Consumer', keywords: ['harvest', 'advance booking'] },
  { labelKey: 'nav.orders', path: '/consumer/orders', icon: Package, section: 'Consumer', keywords: ['my orders', 'purchases'] },
  { labelKey: 'nav.cart', path: '/consumer/cart', icon: ShoppingCart, section: 'Consumer', keywords: ['cart', 'basket'] },

  // ── Farmer ──
  { labelKey: 'nav.products', path: '/farmer/products', icon: Package, section: 'Farmer', keywords: ['my products', 'listings', 'inventory'] },
  { labelKey: 'farmer.products.addProduct', path: '/farmer/products/add', icon: Target, section: 'Farmer', keywords: ['new product', 'create', 'add'] },
  { labelKey: 'nav.orders', path: '/farmer/orders', icon: ClipboardList, section: 'Farmer', keywords: ['sales', 'incoming'] },
  { labelKey: 'nav.clubbing', path: '/farmer/clubbing', icon: TrendingUp, section: 'Farmer', keywords: ['group orders', 'logistics savings'] },
  { labelKey: 'nav.priceAdvisor', path: '/farmer/price-advisor', icon: DollarSign, section: 'AI Tools', keywords: ['price', 'fair price', 'ai pricing'] },
  { labelKey: 'nav.mandiPrices', path: '/farmer/mandi-prices', icon: Landmark, section: 'AI Tools', keywords: ['apmc', 'market prices', 'mandi'] },
  { labelKey: 'nav.coldStorage', path: '/farmer/cold-storage', icon: Snowflake, section: 'Farmer', keywords: ['cold storage', 'store later', 'warehouse', 'cold chain', 'ice box'] },
  { labelKey: 'nav.analytics', path: '/farmer/analytics', icon: BarChart3, section: 'Farmer', keywords: ['earnings', 'insights', 'charts'] },
  { labelKey: 'nav.demandMap', path: '/farmer/demand-map', icon: Map, section: 'AI Tools', keywords: ['heatmap', 'demand', 'where to sell'] },
  { labelKey: 'nav.upcomingHarvests', path: '/farmer/harvests', icon: Sprout, section: 'Farmer', keywords: ['harvest', 'booking', 'advance'] },
  { labelKey: 'nav.globalListings', path: '/farmer/global-listings', icon: FileText, section: 'Global Trade', keywords: ['export', 'international'] },

  // ── B2B Buyer ──
  { labelKey: 'nav.requirements', path: '/buyer/requirement', icon: ClipboardList, section: 'Buyer', keywords: ['post requirement', 'rfq'] },
  { labelKey: 'nav.orders', path: '/buyer/orders', icon: Package, section: 'Buyer', keywords: ['my orders'] },

  // ── Logistics ──
  { labelKey: 'nav.deliveryRequests', path: '/logistics/requests', icon: Truck, section: 'Logistics', keywords: ['deliveries', 'requests'] },
  { labelKey: 'nav.activeRoute', path: '/logistics/active-route', icon: MapPin, section: 'Logistics', keywords: ['route', 'navigation', 'gps'] },

  // ── Admin ──
  { labelKey: 'nav.users', path: '/admin/users', icon: Users, section: 'Admin', keywords: ['user management', 'accounts'] },
  { labelKey: 'nav.orders', path: '/admin/orders', icon: Package, section: 'Admin', keywords: ['all orders'] },
  { labelKey: 'nav.deliveryRules', path: '/admin/delivery-rules', icon: Settings, section: 'Admin', keywords: ['rules', 'config'] },
  { labelKey: 'nav.disputes', path: '/admin/disputes', icon: AlertTriangle, section: 'Admin', keywords: ['complaints', 'issues'] },
  { labelKey: 'nav.analytics', path: '/admin/analytics', icon: BarChart3, section: 'Admin', keywords: ['stats', 'reports'] },
  { labelKey: 'nav.map', path: '/admin/supply-demand', icon: Map, section: 'Admin', keywords: ['heatmap', 'supply demand'] },
  { labelKey: 'nav.globalRFQs', path: '/global/rfqs', icon: FileText, section: 'Global Trade', keywords: ['rfq', 'quotes', 'requests'] },

  // ── Global Trade (all roles) ──
  { labelKey: 'nav.globalTrade', path: '/global/marketplace', icon: Globe, section: 'Global Trade', keywords: ['export', 'international', 'bulk', 'worldwide'] },
];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Get nav entries for a specific user role.
 * Includes the dashboard entry (resolved to the correct role-specific path)
 * plus all role-specific and shared global trade entries.
 */
export function getNavEntriesForRole(role: UserRole): NavEntry[] {
  const roleSpecificPaths: Record<UserRole, string> = {
    FARMER: '/farmer/dashboard',
    FPO: '/farmer/dashboard',
    CONSUMER: '/consumer/dashboard',
    B2B_BUYER: '/buyer/dashboard',
    LOGISTICS: '/logistics/dashboard',
    ADMIN: '/admin/dashboard',
  };

  // Start with dashboard entry
  const dashboard = ALL_ROUTES.find(e => e.path === '__dashboard__')!;
  const result: NavEntry[] = [
    { ...dashboard, path: roleSpecificPaths[role] },
  ];

  // Add all entries matching the role
  for (const entry of ALL_ROUTES) {
    if (entry.path === '__dashboard__') continue;

    // Global trade is available to all roles
    if (entry.section === 'Global Trade') {
      result.push(entry);
      continue;
    }

    // Role-specific entries
    if (isEntryForRole(entry, role)) {
      result.push(entry);
    }
  }

  return result;
}

function isEntryForRole(entry: NavEntry, role: UserRole): boolean {
  switch (role) {
    case 'CONSUMER': return entry.section === 'Consumer';
    case 'FARMER': case 'FPO': return entry.section === 'Farmer' || entry.section === 'AI Tools';
    case 'B2B_BUYER': return entry.section === 'Buyer';
    case 'LOGISTICS': return entry.section === 'Logistics';
    case 'ADMIN': return entry.section === 'Admin';
    default: return false;
  }
}

export function getPaletteEntries(role: UserRole): NavEntry[] {
  return getNavEntriesForRole(role);
}

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    FARMER: '/farmer/dashboard',
    FPO: '/farmer/dashboard',
    CONSUMER: '/consumer/dashboard',
    B2B_BUYER: '/buyer/dashboard',
    LOGISTICS: '/logistics/dashboard',
    ADMIN: '/admin/dashboard',
  };
  return paths[role] ?? '/';
}

/**
 * Convert a URL path segment to a readable label.
 */
export function segmentToLabel(segment: string, t: (key: string) => string): string | null {
  if (segment.length > 15) return null; // Skip CUIDs

  const keyMap: Record<string, string> = {
    dashboard: 'nav.dashboard',
    products: 'nav.products',
    add: 'farmer.products.addProduct',
    orders: 'nav.orders',
    clubbing: 'nav.clubbing',
    'price-advisor': 'nav.priceAdvisor',
    'mandi-prices': 'nav.mandiPrices',
    'cold-storage': 'nav.coldStorage',
    analytics: 'nav.analytics',
    'demand-map': 'nav.demandMap',
    harvests: 'nav.upcomingHarvests',
    'global-listings': 'nav.globalListings',
    marketplace: 'nav.marketplace',
    'farmers-map': 'nav.map',
    'upcoming-harvests': 'nav.upcomingHarvests',
    cart: 'nav.cart',
    requirement: 'nav.requirements',
    requests: 'nav.deliveryRequests',
    'active-route': 'nav.activeRoute',
    users: 'nav.users',
    'delivery-rules': 'nav.deliveryRules',
    disputes: 'nav.disputes',
    'supply-demand': 'nav.map',
    rfqs: 'nav.globalRFQs',
    'global-marketplace': 'nav.globalTrade',
    'global-rfq': 'RFQ Detail',
    'global-product': 'Product Detail',
  };

  const key = keyMap[segment];
  if (key) return t(key);

  return segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Re-exports ───────────────────────────────────────────────────────────────

export {
  LayoutDashboard, ShoppingCart, Package, Map, Sprout, ClipboardList,
  TrendingUp, Target, DollarSign, Landmark, BarChart3, Users, AlertTriangle,
  Settings, Truck, MapPin, Globe, FileText, Bell, LogOut, Menu, X, Search,
  ChevronRight, Home, Snowflake
} from 'lucide-react';
