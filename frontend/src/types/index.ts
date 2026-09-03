export type UserRole = 'CONSUMER' | 'FARMER' | 'FPO' | 'B2B_BUYER' | 'LOGISTICS' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  isVerified?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  pricePerKg: number;
  unit?: string;
  availableQuantity: number;
  minOrderQuantity: number;
  qualityGrade: string;
  organicCertified: boolean;
  harvestDate?: string;
  shelfLife?: number;
  coldChainRequired: boolean;
  avgRating: number;
  totalSold: number;
  isActive: boolean;
  farmerId: string;
  categoryId?: string;
  category?: { id: string; name: string; icon?: string };
  farmer?: any;
  images?: { id: string; url: string; isPrimary: boolean }[];
  deliveryRule?: DeliveryRule;
  distance?: number;
}

export interface DeliveryRule {
  deliveryMode: string;
  maxDeliveryRadiusKm: number;
  interstateAllowed: boolean;
  coldChainRequired: boolean;
  maximumTransitHours: number;
  sameDayRequired: boolean;
}

export interface Order {
  id: string;
  buyerId: string;
  farmerId: string;
  productId: string;
  quantity: number;
  pricePerKg: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  status: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  createdAt: string;
  product?: Product;
  buyer?: { name: string; id: string };
  farmer?: { name: string; id: string };
  delivery?: Delivery;
  statusHistory?: OrderStatusHistory[];
}

export interface Delivery {
  id: string;
  orderId: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  estimatedPickup?: string;
  estimatedArrival?: string;
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface DeliveryQuote {
  baseFare: number;
  distanceCharge: number;
  handlingCharge: number;
  specialHandling: number;
  total: number;
  distance: number;
  estimatedTime: number;
  vehicleType: string;
}

export interface ClubbingRoute {
  routeId: string;
  orders: any[];
  totalQuantity: number;
  vehicleType: string;
  vehicleCapacity: number;
  totalDistance: number;
  estimatedTime: number;
  separateCost: number;
  clubbedCost: number;
  savings: number;
  optimizedSequence: any[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'farmer' | 'buyer' | 'hub';
  city?: string;
  specializations?: string[];
  trustScore?: number;
  organic?: boolean;
  businessType?: string;
}

export interface FairPriceResult {
  fair_price: number;
  recommended_price: number;
  confidence: number;
  trend: string;
  recommendation: string;
  market_range: { low: number; high: number };
}

export interface DemandForecast {
  product: string;
  region: string;
  forecast: string;
  demand_level: string;
  expected_price_change: number;
  supply_status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
