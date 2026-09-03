import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001') || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'kisan-direct-dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },
  map: {
    provider: process.env.MAP_PROVIDER || 'demo',
    key: process.env.MAP_PROVIDER_KEY || '',
    geocodingKey: process.env.GEOCODING_API_KEY || '',
    routingKey: process.env.ROUTING_API_KEY || '',
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'demo',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  logistics: {
    provider: process.env.LOGISTICS_PROVIDER || 'demo',
    porterApiKey: process.env.PORTER_API_KEY || '',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_ANON_KEY || '',
  },
  isDemoMode: () => {
    return (
      (process.env.MAP_PROVIDER || 'demo') === 'demo' &&
      (process.env.PAYMENT_PROVIDER || 'demo') === 'demo' &&
      (process.env.LOGISTICS_PROVIDER || 'demo') === 'demo'
    );
  },
};
