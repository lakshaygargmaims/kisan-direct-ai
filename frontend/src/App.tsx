import { useEffect, Suspense, lazy } from 'react';
import { VoiceButton } from './components/shared/VoiceButton';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// ── Lazy-loaded pages (grouped by route prefix for chunk splitting) ──────

// Public
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));

// Consumer
const ConsumerDashboard = lazy(() => import('./pages/consumer/ConsumerDashboard'));
const Marketplace = lazy(() => import('./pages/consumer/Marketplace'));
const ProductDetails = lazy(() => import('./pages/consumer/ProductDetails'));
const CartPage = lazy(() => import('./pages/consumer/CartPage'));
const OrdersPage = lazy(() => import('./pages/consumer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/consumer/OrderDetailPage'));
const FarmersMapPage = lazy(() => import('./pages/consumer/FarmersMapPage'));
const UpcomingHarvestsPage = lazy(() => import('./pages/consumer/UpcomingHarvestsPage'));

// Farmer
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const FarmerProducts = lazy(() => import('./pages/farmer/FarmerProducts'));
const AddProduct = lazy(() => import('./pages/farmer/AddProduct'));
const FarmerOrders = lazy(() => import('./pages/farmer/FarmerOrders'));
const OrderClubbing = lazy(() => import('./pages/farmer/OrderClubbing'));
const PriceAdvisor = lazy(() => import('./pages/farmer/PriceAdvisor'));
const FarmerAnalytics = lazy(() => import('./pages/farmer/FarmerAnalytics'));
const DemandHeatmap = lazy(() => import('./pages/farmer/DemandHeatmap'));
const UpcomingHarvests = lazy(() => import('./pages/farmer/UpcomingHarvests'));
const AddHarvest = lazy(() => import('./pages/farmer/AddHarvest'));
const GlobalListings = lazy(() => import('./pages/farmer/GlobalListings'));
const AddGlobalProduct = lazy(() => import('./pages/farmer/AddGlobalProduct'));
const MandiPrices = lazy(() => import('./pages/farmer/MandiPrices'));
const ColdStorageFind = lazy(() => import('./pages/farmer/ColdStorageFind'));
const ColdStorageBook = lazy(() => import('./pages/farmer/ColdStorageBook'));
const ColdStorageInventory = lazy(() => import('./pages/farmer/ColdStorageInventory'));

// B2B Buyer
const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const PostRequirement = lazy(() => import('./pages/buyer/PostRequirement'));
const BuyerOrders = lazy(() => import('./pages/buyer/BuyerOrders'));

// Logistics
const LogisticsDashboard = lazy(() => import('./pages/logistics/LogisticsDashboard'));
const DeliveryRequests = lazy(() => import('./pages/logistics/DeliveryRequests'));
const ActiveRoute = lazy(() => import('./pages/logistics/ActiveRoute'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const DeliveryRules = lazy(() => import('./pages/admin/DeliveryRules'));
const Disputes = lazy(() => import('./pages/admin/Disputes'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const SupplyDemandMap = lazy(() => import('./pages/admin/SupplyDemandMap'));

// Global Trade
const GlobalMarketplace = lazy(() => import('./pages/global/GlobalMarketplace'));
const CreateRFQ = lazy(() => import('./pages/global/CreateRFQ'));
const GlobalRFQList = lazy(() => import('./pages/global/GlobalRFQList'));
const GlobalRFQDetail = lazy(() => import('./pages/global/GlobalRFQDetail'));
const GlobalTradeMap = lazy(() => import('./pages/global/GlobalTradeMap'));
const GlobalProductDetail = lazy(() => import('./pages/global/GlobalProductDetail'));

// ── Loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// ── Route guard ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, token, isLoading } = useAuthStore();

  if (isLoading || (token && !user)) {
    return <PageLoader />;
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ── App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { token, user, loadUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  return (
    <>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Consumer */}
        <Route path="/consumer" element={<ProtectedRoute allowedRoles={['CONSUMER']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<ConsumerDashboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="farmers-map" element={<FarmersMapPage />} />
          <Route path="upcoming-harvests" element={<UpcomingHarvestsPage />} />
        </Route>

        {/* Farmer */}
        <Route path="/farmer" element={<ProtectedRoute allowedRoles={['FARMER', 'FPO']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<FarmerDashboard />} />
          <Route path="products" element={<FarmerProducts />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="orders" element={<FarmerOrders />} />
          <Route path="clubbing" element={<OrderClubbing />} />
          <Route path="price-advisor" element={<PriceAdvisor />} />
          <Route path="analytics" element={<FarmerAnalytics />} />
          <Route path="demand-map" element={<DemandHeatmap />} />
          <Route path="harvests" element={<UpcomingHarvests />} />
          <Route path="harvests/add" element={<AddHarvest />} />
          <Route path="global-listings" element={<GlobalListings />} />
          <Route path="global-listings/add" element={<AddGlobalProduct />} />
          <Route path="mandi-prices" element={<MandiPrices />} />
          <Route path="cold-storage" element={<ColdStorageFind />} />
          <Route path="cold-storage/:id" element={<ColdStorageBook />} />
          <Route path="cold-storage/inventory" element={<ColdStorageInventory />} />
        </Route>

        {/* B2B Buyer */}
        <Route path="/buyer" element={<ProtectedRoute allowedRoles={['B2B_BUYER']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<BuyerDashboard />} />
          <Route path="requirement" element={<PostRequirement />} />
          <Route path="orders" element={<BuyerOrders />} />
        </Route>

        {/* Logistics */}
        <Route path="/logistics" element={<ProtectedRoute allowedRoles={['LOGISTICS']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<LogisticsDashboard />} />
          <Route path="requests" element={<DeliveryRequests />} />
          <Route path="active-route" element={<ActiveRoute />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="delivery-rules" element={<DeliveryRules />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="supply-demand" element={<SupplyDemandMap />} />
        </Route>

        {/* Global Trade */}
        <Route path="/global" element={<PublicLayout />}>
          <Route path="marketplace" element={<GlobalMarketplace />} />
          <Route path="products/:id" element={<GlobalProductDetail />} />
          <Route path="rfq/new" element={<CreateRFQ />} />
          <Route path="rfqs" element={<GlobalRFQList />} />
          <Route path="rfq/:id" element={<GlobalRFQDetail />} />
          <Route path="map" element={<GlobalTradeMap />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    {user && (user.role === 'FARMER' || user.role === 'FPO') && location.pathname.startsWith('/farmer') && <VoiceButton />}
    </>
  );
}
