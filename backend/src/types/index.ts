import { Request } from 'express';

export type UserRole = 'CONSUMER' | 'FARMER' | 'FPO' | 'B2B_BUYER' | 'LOGISTICS' | 'ADMIN';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeliveryQuote {
  baseFare: number;
  distanceCharge: number;
  handlingCharge: number;
  specialHandling: number;
  total: number;
  estimatedTime: number;
  vehicleType: string;
}

export interface OrderClubCandidate {
  orderId: string;
  buyerLocation: { lat: number; lng: number };
  quantity: number;
  distance: number;
  compatible: boolean;
  reason?: string;
}

export interface FairPriceResult {
  fairPrice: number;
  recommendedPrice: number;
  confidence: number;
  trend: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  recommendation: string;
  marketRange: { low: number; high: number };
}

export interface DemandForecast {
  product: string;
  region: string;
  forecast: string;
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  expectedPriceChange: number;
  timeframe: string;
}

export interface FarmerRanking {
  farmerId: string;
  score: number;
  breakdown: {
    distance: number;
    price: number;
    availability: number;
    rating: number;
    deliveryTime: number;
  };
}
