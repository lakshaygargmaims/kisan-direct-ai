import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Consumer pages
import ConsumerDashboard from './pages/consumer/ConsumerDashboard';
import Marketplace from './pages/consumer/Marketplace';
import ProductDetails from './pages/consumer/ProductDetails';
import CartPage from './pages/consumer/CartPage';
import OrdersPage from './pages/consumer/OrdersPage';
import OrderDetailPage from './pages/consumer/OrderDetailPage';
import FarmersMapPage from './pages/consumer/FarmersMapPage';
import UpcomingHarvestsPage from './pages/consumer/UpcomingHarvestsPage';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProducts from './pages/farmer/FarmerProducts';
import AddProduct from './pages/farmer/AddProduct';
import FarmerOrders from './pages/farmer/FarmerOrders';
import OrderClubbing from './pages/farmer/OrderClubbing';
import PriceAdvisor from './pages/farmer/PriceAdvisor';
import FarmerAnalytics from './pages/farmer/FarmerAnalytics';
import DemandHeatmap from './pages/farmer/DemandHeatmap';
import UpcomingHarvests from './pages/farmer/UpcomingHarvests';
import AddHarvest from './pages/farmer/AddHarvest';

// B2B Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import PostRequirement from './pages/buyer/PostRequirement';
import BuyerOrders from './pages/buyer/BuyerOrders';

// Logistics pages
import LogisticsDashboard from './pages/logistics/LogisticsDashboard';
import DeliveryRequests from './pages/logistics/DeliveryRequests';
import ActiveRoute from './pages/logistics/ActiveRoute';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OrderManagement from './pages/admin/OrderManagement';
import DeliveryRules from './pages/admin/DeliveryRules';
import Disputes from './pages/admin/Disputes';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import SupplyDemandMap from './pages/admin/SupplyDemandMap';

// Global Trade pages
import GlobalMarketplace from './pages/global/GlobalMarketplace';
import CreateRFQ from './pages/global/CreateRFQ';
import GlobalRFQList from './pages/global/GlobalRFQList';
import GlobalRFQDetail from './pages/global/GlobalRFQDetail';
import GlobalTradeMap from './pages/global/GlobalTradeMap';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, token, isLoading } = useAuthStore();

  if (isLoading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { token, loadUser } = useAuthStore();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  return (
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
        <Route path="products/:id" element={<GlobalMarketplace />} />
        <Route path="rfq/new" element={<CreateRFQ />} />
        <Route path="rfqs" element={<GlobalRFQList />} />
        <Route path="rfq/:id" element={<GlobalRFQDetail />} />
        <Route path="map" element={<GlobalTradeMap />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
