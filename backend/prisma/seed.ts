import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PW = bcrypt.hashSync('demo123', 10);

// ─── Helpers ──────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const round2 = (n: number) => Math.round(n * 100) / 100;

// ─── NCR locations ───────────────────────────────────────────────
const NCR = [
  { city: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { city: 'South Delhi', lat: 28.5245, lng: 77.2066 },
  { city: 'North Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'West Delhi', lat: 28.6139, lng: 77.1000 },
  { city: 'East Delhi', lat: 28.6353, lng: 77.2966 },
  { city: 'Central Delhi', lat: 28.6300, lng: 77.2170 },
  { city: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { city: 'Noida', lat: 28.5355, lng: 77.3910 },
  { city: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { city: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  { city: 'Greater Noida', lat: 28.4744, lng: 77.5040 },
  { city: 'Sonipat', lat: 28.9833, lng: 77.0167 },
  { city: 'Bahadurgarh', lat: 28.6700, lng: 76.9300 },
  { city: 'Panipat', lat: 29.3909, lng: 76.9635 },
  { city: 'Rohtak', lat: 28.8955, lng: 76.6066 },
  { city: 'Meerut', lat: 28.9845, lng: 77.7064 },
  { city: 'Rewari', lat: 28.4388, lng: 76.6169 },
  { city: 'Palwal', lat: 28.1436, lng: 77.7695 },
  { city: 'Hisar', lat: 29.1492, lng: 75.7217 },
  { city: 'Karnal', lat: 29.6857, lng: 76.9905 },
];

// ─── Categories ──────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Vegetables', icon: '🥬' },
  { name: 'Fruits', icon: '🍎' },
  { name: 'Grains', icon: '🌾' },
  { name: 'Pulses', icon: '🫘' },
  { name: 'Spices', icon: '🌶️' },
  { name: 'Dairy', icon: '🥛' },
  { name: 'Processed', icon: '📦' },
  { name: 'Other', icon: '🌿' },
];

// ─── Farmer data ────────────────────────────────────────────────
const FARMERS = [
  { name: 'Rajesh Kumar', email: 'farmer@demo.com', farm: 'Rajesh Organic Farm', city: 'Gurugram', lat: 28.4595, lng: 77.0266, specs: ['Vegetables', 'Fruits'], organic: true, trust: 92, size: '12 acres', rating: 4.8 },
  { name: 'Suresh Singh', email: 'farmer2@demo.com', farm: 'Singh Agro Farm', city: 'Faridabad', lat: 28.4089, lng: 77.3178, specs: ['Grains', 'Pulses'], organic: false, trust: 85, size: '25 acres', rating: 4.5 },
  { name: 'Mohammed Ali', email: 'farmer3@demo.com', farm: 'Green Valley Farm', city: 'Noida', lat: 28.5355, lng: 77.3910, specs: ['Vegetables', 'Spices'], organic: true, trust: 88, size: '8 acres', rating: 4.6 },
  { name: 'Ram Prasad', email: 'farmer4@demo.com', farm: 'Prasad Dairy Farm', city: 'Bahadurgarh', lat: 28.6700, lng: 76.9300, specs: ['Dairy'], organic: true, trust: 90, size: '5 acres + 50 cows', rating: 4.9 },
  { name: 'Anita Devi', email: 'farmer5@demo.com', farm: 'Devi Organic Garden', city: 'Sonipat', lat: 28.9833, lng: 77.0167, specs: ['Fruits', 'Vegetables'], organic: true, trust: 87, size: '15 acres', rating: 4.7 },
  { name: 'Vikram Patel', email: 'farmer6@demo.com', farm: 'Patel Grain House', city: 'Panipat', lat: 29.3909, lng: 76.9635, specs: ['Grains'], organic: false, trust: 82, size: '40 acres', rating: 4.3 },
  { name: 'Kamla Devi', email: 'farmer7@demo.com', farm: 'Kamla Spice Farm', city: 'Rohtak', lat: 28.8955, lng: 76.6066, specs: ['Spices', 'Pulses'], organic: true, trust: 86, size: '10 acres', rating: 4.6 },
  { name: 'Gopal Krishna', email: 'farmer8@demo.com', farm: 'Krishna Fruit Garden', city: 'Meerut', lat: 28.9845, lng: 77.7064, specs: ['Fruits'], organic: false, trust: 80, size: '20 acres', rating: 4.2 },
  { name: 'Harish Sharma', email: 'farmer9@demo.com', farm: 'Sharma Agro Processing', city: 'Ghaziabad', lat: 28.6692, lng: 77.4538, specs: ['Processed', 'Vegetables'], organic: false, trust: 78, size: '18 acres + mill', rating: 4.1 },
  { name: 'Meena Kumari', email: 'farmer10@demo.com', farm: 'Meena Fresh Produce', city: 'Greater Noida', lat: 28.4744, lng: 77.5040, specs: ['Vegetables', 'Fruits'], organic: true, trust: 91, size: '10 acres', rating: 4.8 },
  { name: 'Dharamvir Singh', email: 'farmer11@demo.com', farm: 'DS Wheat Estate', city: 'Sonipat', lat: 29.0000, lng: 77.0200, specs: ['Grains'], organic: false, trust: 83, size: '50 acres', rating: 4.4 },
  { name: 'Saroj Devi', email: 'farmer12@demo.com', farm: 'Saroj Organic Farm', city: 'Panipat', lat: 29.3800, lng: 76.9500, specs: ['Vegetables', 'Fruits'], organic: true, trust: 89, size: '7 acres', rating: 4.7 },
  { name: 'Irfan Khan', email: 'farmer13@demo.com', farm: 'Khan Dairy Products', city: 'Rohtak', lat: 28.9000, lng: 76.6100, specs: ['Dairy'], organic: false, trust: 84, size: '3 acres + 30 cows', rating: 4.5 },
  { name: 'Prakash Jha', email: 'farmer14@demo.com', farm: 'Jha Spice Garden', city: 'Meerut', lat: 28.9900, lng: 77.7100, specs: ['Spices', 'Other'], organic: true, trust: 87, size: '6 acres', rating: 4.6 },
  { name: 'Lakshmi Nair', email: 'farmer15@demo.com', farm: 'Nair Fresh Market', city: 'Noida', lat: 28.5400, lng: 77.3950, specs: ['Vegetables', 'Fruits'], organic: true, trust: 93, size: '9 acres', rating: 4.9 },
  { name: 'Ravi Teja', email: 'farmer16@demo.com', farm: 'Teja Poultry & Produce', city: 'Faridabad', lat: 28.4100, lng: 77.3200, specs: ['Other', 'Vegetables'], organic: false, trust: 79, size: '14 acres', rating: 4.0 },
  { name: 'Usha Rani', email: 'farmer17@demo.com', farm: 'Usha Grain Trading', city: 'Gurugram', lat: 28.4600, lng: 77.0300, specs: ['Grains', 'Pulses'], organic: false, trust: 81, size: '30 acres', rating: 4.3 },
  { name: 'Manoj Gupta', email: 'farmer18@demo.com', farm: 'Gupta Organic Retreat', city: 'Ghaziabad', lat: 28.6700, lng: 77.4600, specs: ['Vegetables', 'Fruits'], organic: true, trust: 88, size: '11 acres', rating: 4.7 },
  { name: 'Savita Ben', email: 'farmer19@demo.com', farm: 'Savita Green Foods', city: 'Greater Noida', lat: 28.4800, lng: 77.5100, specs: ['Processed', 'Spices'], organic: true, trust: 86, size: '8 acres + unit', rating: 4.5 },
  { name: 'Ashok Yadav', email: 'farmer20@demo.com', farm: 'Yadav Vegetable Hub', city: 'Bahadurgarh', lat: 28.6800, lng: 76.9350, specs: ['Vegetables'], organic: false, trust: 80, size: '22 acres', rating: 4.2 },
  // ─── Additional 15 farmers ────────────────────────────────────
  { name: 'Vikash Jatav', email: 'farmer21@demo.com', farm: 'Jatav Organic Fields', city: 'Rewari', lat: 28.4388, lng: 76.6169, specs: ['Grains', 'Pulses'], organic: true, trust: 84, size: '35 acres', rating: 4.4 },
  { name: 'Sunita Yadav', email: 'farmer22@demo.com', farm: 'Yadav Fresh Vegetables', city: 'Palwal', lat: 28.1436, lng: 77.7695, specs: ['Vegetables'], organic: false, trust: 81, size: '18 acres', rating: 4.2 },
  { name: 'Dinesh Chandra', email: 'farmer23@demo.com', farm: 'Chandra Grain Mills', city: 'Hisar', lat: 29.1492, lng: 75.7217, specs: ['Grains', 'Other'], organic: false, trust: 80, size: '45 acres + mill', rating: 4.1 },
  { name: 'Pooja Rani', email: 'farmer24@demo.com', farm: 'Rani Dairy Farm', city: 'Karnal', lat: 29.6857, lng: 76.9905, specs: ['Dairy'], organic: true, trust: 91, size: '4 acres + 40 cows', rating: 4.8 },
  { name: 'Ajay Gurjar', email: 'farmer25@demo.com', farm: 'Gurjar Spice House', city: 'Rohtak', lat: 28.9100, lng: 76.5900, specs: ['Spices', 'Vegetables'], organic: true, trust: 85, size: '12 acres', rating: 4.5 },
  { name: 'Rekha Devi', email: 'farmer26@demo.com', farm: 'Devi Fruit Orchards', city: 'Meerut', lat: 28.9750, lng: 77.6800, specs: ['Fruits'], organic: true, trust: 89, size: '22 acres orchard', rating: 4.7 },
  { name: 'Sunil Kumar', email: 'farmer27@demo.com', farm: 'Kumar Veggie Hub', city: 'Ghaziabad', lat: 28.6800, lng: 77.4400, specs: ['Vegetables', 'Fruits'], organic: false, trust: 79, size: '16 acres', rating: 4.0 },
  { name: 'Anjali Bhati', email: 'farmer28@demo.com', farm: 'Bhati Organic Farm', city: 'Noida', lat: 28.5500, lng: 77.4100, specs: ['Vegetables', 'Dairy'], organic: true, trust: 90, size: '8 acres + 20 cows', rating: 4.8 },
  { name: 'Pradeep Tomar', email: 'farmer29@demo.com', farm: 'Tomar Wheat Kingdom', city: 'Sonipat', lat: 29.0100, lng: 77.0400, specs: ['Grains'], organic: false, trust: 82, size: '55 acres', rating: 4.3 },
  { name: 'Kavita Sharma', email: 'farmer30@demo.com', farm: 'Sharma Fresh Fruits', city: 'New Delhi', lat: 28.6200, lng: 77.2200, specs: ['Fruits', 'Vegetables'], organic: true, trust: 94, size: '6 acres', rating: 4.9 },
  { name: 'Mohsin Khan', email: 'farmer31@demo.com', farm: 'Khan Organic Garden', city: 'Faridabad', lat: 28.4200, lng: 77.3000, specs: ['Vegetables', 'Spices'], organic: true, trust: 87, size: '10 acres', rating: 4.6 },
  { name: 'Neelam Singh', email: 'farmer32@demo.com', farm: 'Singh Premium Dairy', city: 'Gurugram', lat: 28.4700, lng: 77.0400, specs: ['Dairy'], organic: false, trust: 83, size: '3 acres + 60 cows', rating: 4.4 },
  { name: 'Tilak Raj', email: 'farmer33@demo.com', farm: 'Raj Processed Foods', city: 'Panipat', lat: 29.3950, lng: 76.9700, specs: ['Processed', 'Grains'], organic: false, trust: 78, size: '20 acres + unit', rating: 4.0 },
  { name: 'Priyanka Mehra', email: 'farmer34@demo.com', farm: 'Mehra Garden Fresh', city: 'New Delhi', lat: 28.6350, lng: 77.2100, specs: ['Vegetables', 'Fruits'], organic: true, trust: 92, size: '5 acres', rating: 4.8 },
  { name: 'Balraj Dahiya', email: 'farmer35@demo.com', farm: 'Dahiya Mixed Farm', city: 'Bahadurgarh', lat: 28.6900, lng: 76.9200, specs: ['Vegetables', 'Grains', 'Dairy'], organic: false, trust: 81, size: '28 acres + 15 cows', rating: 4.2 },
];

// ─── Consumer data ──────────────────────────────────────────────
const CONSUMERS = [
  { name: 'Priya Sharma', email: 'consumer@demo.com', city: 'South Delhi', lat: 28.5245, lng: 77.2066 },
  { name: 'Amit Patel', email: 'consumer2@demo.com', city: 'West Delhi', lat: 28.6139, lng: 77.1000 },
  { name: 'Neha Gupta', email: 'consumer3@demo.com', city: 'North Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Rahul Verma', email: 'consumer4@demo.com', city: 'Central Delhi', lat: 28.6300, lng: 77.2170 },
  { name: 'Sunita Rani', email: 'consumer5@demo.com', city: 'East Delhi', lat: 28.6353, lng: 77.2966 },
  { name: 'Deepak Joshi', email: 'consumer6@demo.com', city: 'Gurugram', lat: 28.4650, lng: 77.0350 },
  { name: 'Kavita Singh', email: 'consumer7@demo.com', city: 'Noida', lat: 28.5300, lng: 77.3850 },
  { name: 'Manish Dubey', email: 'consumer8@demo.com', city: 'Ghaziabad', lat: 28.6650, lng: 77.4500 },
  { name: 'Pooja Agarwal', email: 'consumer9@demo.com', city: 'Faridabad', lat: 28.4150, lng: 77.3150 },
  { name: 'Vikas Kumar', email: 'consumer10@demo.com', city: 'Greater Noida', lat: 28.4800, lng: 77.5000 },
  { name: 'Anjali Mehta', email: 'consumer11@demo.com', city: 'South Delhi', lat: 28.5300, lng: 77.2100 },
  { name: 'Saurabh Mishra', email: 'consumer12@demo.com', city: 'Central Delhi', lat: 28.6250, lng: 77.2150 },
  { name: 'Ritu Bajaj', email: 'consumer13@demo.com', city: 'West Delhi', lat: 28.6100, lng: 77.0950 },
  { name: 'Tarun Chauhan', email: 'consumer14@demo.com', city: 'North Delhi', lat: 28.7100, lng: 77.1100 },
  { name: 'Divya Kapoor', email: 'consumer15@demo.com', city: 'Noida', lat: 28.5400, lng: 77.4000 },
];

// ─── B2B Buyer data ─────────────────────────────────────────────
const BUYERS = [
  { name: 'Hotel Fresh Picks', email: 'buyer@demo.com', type: 'Restaurant', city: 'Connaught Place', lat: 28.6300, lng: 77.2170 },
  { name: 'Grand Plaza Hotel', email: 'buyer2@demo.com', type: 'Hotel', city: 'South Delhi', lat: 28.5300, lng: 77.2200 },
  { name: 'Fresh Mart Retail', email: 'buyer3@demo.com', type: 'Retailer', city: 'Noida', lat: 28.5355, lng: 77.3910 },
  { name: 'Spice Kitchen', email: 'buyer4@demo.com', type: 'Restaurant', city: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { name: 'Daily Fresh Groceries', email: 'buyer5@demo.com', type: 'Grocery Store', city: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  { name: 'Royal Feast Catering', email: 'buyer6@demo.com', type: 'Caterer', city: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { name: 'Green Basket Organics', email: 'buyer7@demo.com', type: 'Retailer', city: 'South Delhi', lat: 28.5200, lng: 77.2000 },
  { name: 'Tandoori Nights', email: 'buyer8@demo.com', type: 'Restaurant', city: 'Noida', lat: 28.5400, lng: 77.3950 },
  { name: 'FreshLine Foods', email: 'buyer9@demo.com', type: 'Processor', city: 'Gurugram', lat: 28.4700, lng: 77.0400 },
  { name: 'Metro Fresh Market', email: 'buyer10@demo.com', type: 'Retailer', city: 'Delhi', lat: 28.6150, lng: 77.2100 },
];

// ─── FPO data ───────────────────────────────────────────────────
const FPO_DATA = [
  { name: 'Green Valley FPO', email: 'fpo@demo.com', city: 'Ghaziabad', lat: 28.6692, lng: 77.4538, specs: ['Grains', 'Pulses', 'Spices'], trust: 88 },
  { name: 'Delhi NCR Collective', email: 'fpo2@demo.com', city: 'Noida', lat: 28.5355, lng: 77.3910, specs: ['Vegetables', 'Fruits'], trust: 85 },
  { name: 'Haryana Organic', email: 'fpo3@demo.com', city: 'Faridabad', lat: 28.4089, lng: 77.3178, specs: ['Vegetables', 'Dairy'], trust: 90 },
];

// ─── Product images (Unsplash — free to use) ────────────────────
const PRODUCT_IMAGES: Record<string, string> = {
  // ─── VEGETABLES (Pexels — natural, market-style photos) ────────
  'Tomato': 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?w=400&h=400&fit=crop',
  'Onion': 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?w=400&h=400&fit=crop',
  'Potato': 'https://images.pexels.com/photos/5690916/pexels-photo-5690916.jpeg?w=400&h=400&fit=crop',
  'Cauliflower': 'https://images.pexels.com/photos/5690931/pexels-photo-5690931.jpeg?w=400&h=400&fit=crop',
  'Spinach': 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?w=400&h=400&fit=crop',
  'Green Chili': 'https://images.pexels.com/photos/13915671/pexels-photo-13915671.jpeg?w=400&h=400&fit=crop',
  'Capsicum': 'https://images.pexels.com/photos/1414130/pexels-photo-1414130.jpeg?w=400&h=400&fit=crop',
  'Carrot': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?w=400&h=400&fit=crop',
  'Bottle Gourd': 'https://images.pexels.com/photos/3298680/pexels-photo-3298680.jpeg?w=400&h=400&fit=crop',
  'Bitter Gourd': 'https://images.pexels.com/photos/4750265/pexels-photo-4750265.jpeg?w=400&h=400&fit=crop',
  'Okra (Lady Finger)': 'https://images.pexels.com/photos/4750268/pexels-photo-4750268.jpeg?w=400&h=400&fit=crop',
  'Brinjal': 'https://images.pexels.com/photos/5690920/pexels-photo-5690920.jpeg?w=400&h=400&fit=crop',
  'Cabbage': 'https://images.pexels.com/photos/5690941/pexels-photo-5690941.jpeg?w=400&h=400&fit=crop',
  'Peas': 'https://images.pexels.com/photos/4750273/pexels-photo-4750273.jpeg?w=400&h=400&fit=crop',
  'Beetroot': 'https://images.pexels.com/photos/4750272/pexels-photo-4750272.jpeg?w=400&h=400&fit=crop',
  'Radish': 'https://images.pexels.com/photos/8058857/pexels-photo-8058857.jpeg?w=400&h=400&fit=crop',
  'Spring Onion': 'https://images.pexels.com/photos/5690956/pexels-photo-5690956.jpeg?w=400&h=400&fit=crop',
  'Broccoli': 'https://images.pexels.com/photos/4750271/pexels-photo-4750271.jpeg?w=400&h=400&fit=crop',
  'Sweet Potato': 'https://images.pexels.com/photos/2282678/pexels-photo-2282678.jpeg?w=400&h=400&fit=crop',
  'Turnip': 'https://images.pexels.com/photos/5503297/pexels-photo-5503297.jpeg?w=400&h=400&fit=crop',
  'Pumpkin': 'https://images.pexels.com/photos/5690942/pexels-photo-5690942.jpeg?w=400&h=400&fit=crop',
  'Lettuce': 'https://images.pexels.com/photos/5690944/pexels-photo-5690944.jpeg?w=400&h=400&fit=crop',
  'Garlic': 'https://images.pexels.com/photos/1493111/pexels-photo-1493111.jpeg?w=400&h=400&fit=crop',
  'Ginger': 'https://images.pexels.com/photos/2282677/pexels-photo-2282677.jpeg?w=400&h=400&fit=crop',
  // ─── FRUITS (Pexels — natural, market-style photos) ────────────
  'Apple': 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?w=400&h=400&fit=crop',
  'Banana': 'https://images.pexels.com/photos/225869/pexels-photo-225869.jpeg?w=400&h=400&fit=crop',
  'Mango': 'https://images.pexels.com/photos/2282671/pexels-photo-2282671.jpeg?w=400&h=400&fit=crop',
  'Orange': 'https://images.pexels.com/photos/4750267/pexels-photo-4750267.jpeg?w=400&h=400&fit=crop',
  'Guava': 'https://images.pexels.com/photos/5946613/pexels-photo-5946613.jpeg?w=400&h=400&fit=crop',
  'Papaya': 'https://images.pexels.com/photos/2282680/pexels-photo-2282680.jpeg?w=400&h=400&fit=crop',
  'Watermelon': 'https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?w=400&h=400&fit=crop',
  'Pomegranate': 'https://images.pexels.com/photos/5765833/pexels-photo-5765833.jpeg?w=400&h=400&fit=crop',
  'Lychee': 'https://images.pexels.com/photos/6294001/pexels-photo-6294001.jpeg?w=400&h=400&fit=crop',
  'Grapes': 'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?w=400&h=400&fit=crop',
  'Strawberry': 'https://images.pexels.com/photos/4750275/pexels-photo-4750275.jpeg?w=400&h=400&fit=crop',
  'Coconut': 'https://images.pexels.com/photos/1412917/pexels-photo-1412917.jpeg?w=400&h=400&fit=crop',
  'Dragon Fruit': 'https://images.pexels.com/photos/4750269/pexels-photo-4750269.jpeg?w=400&h=400&fit=crop',
  'Kiwi': 'https://images.pexels.com/photos/4750263/pexels-photo-4750263.jpeg?w=400&h=400&fit=crop',
  'Custard Apple': 'https://images.pexels.com/photos/5690948/pexels-photo-5690948.jpeg?w=400&h=400&fit=crop',
  'Jackfruit': 'https://images.pexels.com/photos/5690954/pexels-photo-5690954.jpeg?w=400&h=400&fit=crop',
  'Mosambi (Sweet Lime)': 'https://images.pexels.com/photos/4750267/pexels-photo-4750267.jpeg?w=400&h=400&fit=crop',
  // ─── GRAINS (Pexels — natural, farm-style photos) ──────────────
  'Wheat': 'https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?w=400&h=400&fit=crop',
  'Basmati Rice': 'https://images.pexels.com/photos/7426867/pexels-photo-7426867.jpeg?w=400&h=400&fit=crop',
  'Mustard Seeds': 'https://images.pexels.com/photos/5710979/pexels-photo-5710979.jpeg?w=400&h=400&fit=crop',
  'Pearl Millet (Bajra)': 'https://images.pexels.com/photos/4750257/pexels-photo-4750257.jpeg?w=400&h=400&fit=crop',
  'Sorghum (Jowar)': 'https://images.pexels.com/photos/5710944/pexels-photo-5710944.jpeg?w=400&h=400&fit=crop',
  'Maize (Corn)': 'https://images.pexels.com/photos/5472633/pexels-photo-5472633.jpeg?w=400&h=400&fit=crop',
  // ─── PULSES (Pexels — natural, market-style photos) ────────────
  'Moong Dal': 'https://images.pexels.com/photos/6114978/pexels-photo-6114978.jpeg?w=400&h=400&fit=crop',
  'Toor Dal': 'https://images.pexels.com/photos/6114981/pexels-photo-6114981.jpeg?w=400&h=400&fit=crop',
  'Chana Dal': 'https://images.pexels.com/photos/5638124/pexels-photo-5638124.jpeg?w=400&h=400&fit=crop',
  'Urad Dal': 'https://images.pexels.com/photos/6114979/pexels-photo-6114979.jpeg?w=400&h=400&fit=crop',
  'Rajma (Kidney Beans)': 'https://images.pexels.com/photos/6114982/pexels-photo-6114982.jpeg?w=400&h=400&fit=crop',
  // ─── SPICES (Pexels — natural, spice-market-style photos) ──────
  'Turmeric': 'https://images.pexels.com/photos/6220708/pexels-photo-6220708.jpeg?w=400&h=400&fit=crop',
  'Red Chili Powder': 'https://images.pexels.com/photos/3980834/pexels-photo-3980834.jpeg?w=400&h=400&fit=crop',
  'Coriander': 'https://images.pexels.com/photos/6114966/pexels-photo-6114966.jpeg?w=400&h=400&fit=crop',
  'Cumin Seeds': 'https://images.pexels.com/photos/6114963/pexels-photo-6114963.jpeg?w=400&h=400&fit=crop',
  'Fenugreek Seeds': 'https://images.pexels.com/photos/6114969/pexels-photo-6114969.jpeg?w=400&h=400&fit=crop',
  'Black Pepper': 'https://images.pexels.com/photos/3980826/pexels-photo-3980826.jpeg?w=400&h=400&fit=crop',
  'Cardamom': 'https://images.pexels.com/photos/6114965/pexels-photo-6114965.jpeg?w=400&h=400&fit=crop',
  // ─── DAIRY (Pexels — natural, farm-style photos) ───────────────
  'Fresh Milk': 'https://images.pexels.com/photos/248418/pexels-photo-248418.jpeg?w=400&h=400&fit=crop',
  'Paneer': 'https://images.pexels.com/photos/942801/pexels-photo-942801.jpeg?w=400&h=400&fit=crop',
  'Curd': 'https://images.pexels.com/photos/3081997/pexels-photo-3081997.jpeg?w=400&h=400&fit=crop',
  'Ghee': 'https://images.pexels.com/photos/4033324/pexels-photo-4033324.jpeg?w=400&h=400&fit=crop',
  'Butter (Makhan)': 'https://images.pexels.com/photos/209045/pexels-photo-209045.jpeg?w=400&h=400&fit=crop',
  // ─── PROCESSED (Pexels — natural, food-market-style photos) ────
  'Honey': 'https://images.pexels.com/photos/4750264/pexels-photo-4750264.jpeg?w=400&h=400&fit=crop',
  'Flour (Atta)': 'https://images.pexels.com/photos/5690938/pexels-photo-5690938.jpeg?w=400&h=400&fit=crop',
  'Pickles (Achar)': 'https://images.pexels.com/photos/6114974/pexels-photo-6114974.jpeg?w=400&h=400&fit=crop',
  'Jaggery (Gur)': 'https://images.pexels.com/photos/5690940/pexels-photo-5690940.jpeg?w=400&h=400&fit=crop',
  'Papad': 'https://images.pexels.com/photos/6114973/pexels-photo-6114973.jpeg?w=400&h=400&fit=crop',
  'Namkeen': 'https://images.pexels.com/photos/5638125/pexels-photo-5638125.jpeg?w=400&h=400&fit=crop',
  // ─── OTHER (Pexels — natural photos) ──────────────────────────
  'Mushroom': 'https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg?w=400&h=400&fit=crop',
  'Sugarcane Juice': 'https://images.pexels.com/photos/5690957/pexels-photo-5690957.jpeg?w=400&h=400&fit=crop',
  // ─── NEW PRODUCTS ─────────────────────────────────────────────
  'Drumstick (Moringa)': 'https://images.pexels.com/photos/4750276/pexels-photo-4750276.jpeg?w=400&h=400&fit=crop',
  'Pointed Gourd (Parwal)': 'https://images.pexels.com/photos/5503294/pexels-photo-5503294.jpeg?w=400&h=400&fit=crop',
  'Mint Leaves (Pudina)': 'https://images.pexels.com/photos/5503292/pexels-photo-5503292.jpeg?w=400&h=400&fit=crop',
  'Curry Leaves': 'https://images.pexels.com/photos/4750278/pexels-photo-4750278.jpeg?w=400&h=400&fit=crop',
  'French Beans': 'https://images.pexels.com/photos/5690934/pexels-photo-5690934.jpeg?w=400&h=400&fit=crop',
  'Amla (Gooseberry)': 'https://images.pexels.com/photos/5503284/pexels-photo-5503284.jpeg?w=400&h=400&fit=crop',
  'Tamarind (Imli)': 'https://images.pexels.com/photos/5503283/pexels-photo-5503283.jpeg?w=400&h=400&fit=crop',
  'Cloves (Laung)': 'https://images.pexels.com/photos/5503281/pexels-photo-5503281.jpeg?w=400&h=400&fit=crop',
  'Sesame Seeds (Til)': 'https://images.pexels.com/photos/5503286/pexels-photo-5503286.jpeg?w=400&h=400&fit=crop',
  'Fennel Seeds (Saunf)': 'https://images.pexels.com/photos/5503289/pexels-photo-5503289.jpeg?w=400&h=400&fit=crop',
  'Chikoo (Sapodilla)': 'https://images.pexels.com/photos/5503295/pexels-photo-5503295.jpeg?w=400&h=400&fit=crop',
  'Fenugreek Leaves (Methi)': 'https://images.pexels.com/photos/5690950/pexels-photo-5690950.jpeg?w=400&h=400&fit=crop',
};

// ─── Product data ───────────────────────────────────────────────
const PRODUCTS = [
  // Vegetables
  { name: 'Tomato', cat: 'Vegetables', price: 28, qty: 500, grade: 'A', organic: true, shelf: 5, cold: false, minOrder: 5, desc: 'Fresh ripe tomatoes, hand-picked from organic farm' },
  { name: 'Onion', cat: 'Vegetables', price: 22, qty: 2000, grade: 'A', organic: false, shelf: 15, cold: false, minOrder: 10, desc: 'Red onions, well-cured and sorted' },
  { name: 'Potato', cat: 'Vegetables', price: 18, qty: 3000, grade: 'A', organic: false, shelf: 20, cold: false, minOrder: 10, desc: 'Premium quality potatoes, uniform size' },
  { name: 'Cauliflower', cat: 'Vegetables', price: 35, qty: 300, grade: 'A', organic: true, shelf: 4, cold: false, minOrder: 5, desc: 'Fresh white cauliflower heads' },
  { name: 'Spinach', cat: 'Vegetables', price: 20, qty: 200, grade: 'A', organic: true, shelf: 2, cold: true, minOrder: 2, desc: 'Tender organic spinach leaves, same-day harvest' },
  { name: 'Green Chili', cat: 'Vegetables', price: 45, qty: 150, grade: 'A', organic: false, shelf: 7, cold: false, minOrder: 2, desc: 'Spicy green chilies, long variety' },
  { name: 'Capsicum', cat: 'Vegetables', price: 40, qty: 250, grade: 'B', organic: false, shelf: 5, cold: false, minOrder: 3, desc: 'Mixed color bell peppers' },
  { name: 'Carrot', cat: 'Vegetables', price: 30, qty: 400, grade: 'A', organic: true, shelf: 10, cold: false, minOrder: 5, desc: 'Sweet red carrots, seasonal' },
  { name: 'Bottle Gourd', cat: 'Vegetables', price: 25, qty: 180, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 3, desc: 'Fresh lauki, farm-direct' },
  { name: 'Bitter Gourd', cat: 'Vegetables', price: 35, qty: 120, grade: 'A', organic: true, shelf: 4, cold: false, minOrder: 2, desc: 'Organic karela, small variety' },
  { name: 'Okra (Lady Finger)', cat: 'Vegetables', price: 40, qty: 200, grade: 'A', organic: false, shelf: 3, cold: false, minOrder: 3, desc: 'Fresh tender bhindi' },
  { name: 'Brinjal', cat: 'Vegetables', price: 25, qty: 300, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 5, desc: 'Purple brinjal, round variety' },
  { name: 'Pumpkin', cat: 'Vegetables', price: 20, qty: 600, grade: 'A', organic: false, shelf: 14, cold: false, minOrder: 5, desc: 'Red pumpkin, farm fresh' },
  { name: 'Lettuce', cat: 'Vegetables', price: 50, qty: 80, grade: 'A', organic: true, shelf: 3, cold: true, minOrder: 2, desc: 'Fresh green lettuce leaves, hydroponic' },
  { name: 'Garlic', cat: 'Vegetables', price: 60, qty: 400, grade: 'A', organic: false, shelf: 30, cold: false, minOrder: 5, desc: 'Fresh garlic bulbs, strong flavour' },
  { name: 'Ginger', cat: 'Vegetables', price: 55, qty: 200, grade: 'A', organic: true, shelf: 14, cold: false, minOrder: 3, desc: 'Fresh organic ginger, finger variety' },
  { name: 'Cabbage', cat: 'Vegetables', price: 20, qty: 450, grade: 'A', organic: false, shelf: 8, cold: false, minOrder: 5, desc: 'Fresh green cabbage heads' },
  { name: 'Peas', cat: 'Vegetables', price: 55, qty: 100, grade: 'A', organic: true, shelf: 3, cold: true, minOrder: 2, desc: 'Fresh green peas, shelled' },
  { name: 'Beetroot', cat: 'Vegetables', price: 32, qty: 350, grade: 'A', organic: true, shelf: 10, cold: false, minOrder: 3, desc: 'Organic beetroot, deep red variety' },
  { name: 'Radish', cat: 'Vegetables', price: 18, qty: 250, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 3, desc: 'White mooli radish, fresh and crisp' },
  { name: 'Spring Onion', cat: 'Vegetables', price: 25, qty: 120, grade: 'A', organic: true, shelf: 3, cold: true, minOrder: 2, desc: 'Fresh spring onions with greens' },
  { name: 'Broccoli', cat: 'Vegetables', price: 60, qty: 150, grade: 'A', organic: true, shelf: 4, cold: true, minOrder: 2, desc: 'Fresh broccoli florets, high in nutrients' },
  { name: 'Sweet Potato', cat: 'Vegetables', price: 30, qty: 400, grade: 'A', organic: false, shelf: 14, cold: false, minOrder: 5, desc: 'Orange-fleshed sweet potatoes' },
  { name: 'Turnip', cat: 'Vegetables', price: 22, qty: 200, grade: 'A', organic: false, shelf: 7, cold: false, minOrder: 3, desc: 'Fresh white turnips, mild flavour' },
  // Fruits
  { name: 'Apple', cat: 'Fruits', price: 80, qty: 1000, grade: 'A', organic: false, shelf: 14, cold: true, minOrder: 5, desc: 'Himachali apples, Shimla variety' },
  { name: 'Banana', cat: 'Fruits', price: 40, qty: 800, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 5, desc: 'Cavendish bananas, ripe and ready' },
  { name: 'Mango', cat: 'Fruits', price: 120, qty: 600, grade: 'A', organic: true, shelf: 7, cold: true, minOrder: 5, desc: 'Alphonso mangoes, Ratnagiri origin' },
  { name: 'Orange', cat: 'Fruits', price: 60, qty: 700, grade: 'A', organic: false, shelf: 10, cold: false, minOrder: 5, desc: 'Nagpur oranges, juicy and sweet' },
  { name: 'Guava', cat: 'Fruits', price: 45, qty: 350, grade: 'A', organic: true, shelf: 4, cold: false, minOrder: 3, desc: 'Allahabi guavas, seeded variety' },
  { name: 'Papaya', cat: 'Fruits', price: 35, qty: 250, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 3, desc: 'Ripe papaya, solo variety' },
  { name: 'Watermelon', cat: 'Fruits', price: 15, qty: 500, grade: 'A', organic: false, shelf: 3, cold: false, minOrder: 10, desc: 'Seedless watermelon, summer special' },
  { name: 'Pomegranate', cat: 'Fruits', price: 150, qty: 200, grade: 'A', organic: false, shelf: 14, cold: false, minOrder: 3, desc: 'Nagpur pomegranates, ruby red' },
  { name: 'Lychee', cat: 'Fruits', price: 90, qty: 150, grade: 'A', organic: false, shelf: 5, cold: true, minOrder: 3, desc: 'Fresh lychees, Shahi variety from Bihar' },
  { name: 'Grapes', cat: 'Fruits', price: 70, qty: 300, grade: 'A', organic: false, shelf: 7, cold: true, minOrder: 3, desc: 'Green Thompson seedless grapes' },
  { name: 'Strawberry', cat: 'Fruits', price: 180, qty: 100, grade: 'A', organic: true, shelf: 3, cold: true, minOrder: 2, desc: 'Fresh strawberries, Mahabaleshwar origin' },
  { name: 'Coconut', cat: 'Fruits', price: 30, qty: 400, grade: 'A', organic: false, shelf: 14, cold: false, minOrder: 5, desc: 'Fresh tender coconuts, Kerala variety' },
  { name: 'Dragon Fruit', cat: 'Fruits', price: 100, qty: 80, grade: 'A', organic: true, shelf: 5, cold: true, minOrder: 2, desc: 'Pink dragon fruit, organic white-flesh' },
  { name: 'Kiwi', cat: 'Fruits', price: 90, qty: 120, grade: 'A', organic: false, shelf: 10, cold: true, minOrder: 3, desc: 'Golden kiwi, imported quality' },
  // Additional Fruits
  { name: 'Custard Apple', cat: 'Fruits', price: 80, qty: 100, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 3, desc: 'Fresh sitaphal, sweet variety' },
  { name: 'Jackfruit', cat: 'Fruits', price: 40, qty: 200, grade: 'A', organic: false, shelf: 5, cold: false, minOrder: 5, desc: 'Fresh kathal, raw and ripe' },
  { name: 'Mosambi (Sweet Lime)', cat: 'Fruits', price: 35, qty: 300, grade: 'A', organic: false, shelf: 10, cold: false, minOrder: 5, desc: 'Sweet lime, juicy' },
  // Grains
  { name: 'Wheat', cat: 'Grains', price: 25, qty: 5000, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 50, desc: 'Sharbati wheat, premium quality' },
  { name: 'Basmati Rice', cat: 'Grains', price: 45, qty: 3000, grade: 'A', organic: false, shelf: 365, cold: false, minOrder: 25, desc: '1121 Basmati rice, extra long grain' },
  { name: 'Mustard Seeds', cat: 'Grains', price: 55, qty: 1000, grade: 'A', organic: true, shelf: 365, cold: false, minOrder: 10, desc: 'Yellow mustard seeds, whole' },
  { name: 'Pearl Millet (Bajra)', cat: 'Grains', price: 30, qty: 2000, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 25, desc: 'Cleaned bajra grains, Rajasthan origin' },
  { name: 'Sorghum (Jowar)', cat: 'Grains', price: 28, qty: 1500, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 25, desc: 'White jowar, ready to process' },
  { name: 'Maize (Corn)', cat: 'Grains', price: 20, qty: 4000, grade: 'A', organic: false, shelf: 90, cold: false, minOrder: 50, desc: 'Yellow maize, feed and food grade' },
  // Pulses
  { name: 'Moong Dal', cat: 'Pulses', price: 90, qty: 800, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 10, desc: 'Whole green moong, washed' },
  { name: 'Toor Dal', cat: 'Pulses', price: 110, qty: 600, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 10, desc: 'Arhar dal, premium quality' },
  { name: 'Chana Dal', cat: 'Pulses', price: 75, qty: 900, grade: 'A', organic: true, shelf: 180, cold: false, minOrder: 10, desc: 'Organic chana dal, split chickpeas' },
  { name: 'Urad Dal', cat: 'Pulses', price: 100, qty: 500, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 10, desc: 'White urad dal, skinned and split' },
  { name: 'Rajma (Kidney Beans)', cat: 'Pulses', price: 85, qty: 400, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 10, desc: 'Chitra rajma, Jammu variety' },
  // Spices
  { name: 'Turmeric', cat: 'Spices', price: 200, qty: 200, grade: 'A', organic: true, shelf: 365, cold: false, minOrder: 5, desc: 'Organic turmeric powder, high curcumin' },
  { name: 'Red Chili Powder', cat: 'Spices', price: 180, qty: 150, grade: 'A', organic: false, shelf: 365, cold: false, minOrder: 5, desc: 'Kashmiri lal mirch, vibrant color' },
  { name: 'Coriander', cat: 'Spices', price: 120, qty: 300, grade: 'A', organic: true, shelf: 30, cold: true, minOrder: 2, desc: 'Fresh coriander leaves (dhania)' },
  { name: 'Cumin Seeds', cat: 'Spices', price: 250, qty: 100, grade: 'A', organic: false, shelf: 365, cold: false, minOrder: 5, desc: 'Jeera seeds, Rajasthan origin' },
  { name: 'Fenugreek Seeds', cat: 'Spices', price: 90, qty: 150, grade: 'A', organic: false, shelf: 365, cold: false, minOrder: 5, desc: 'Methi dana, whole seeds' },
  { name: 'Black Pepper', cat: 'Spices', price: 600, qty: 80, grade: 'A', organic: true, shelf: 365, cold: false, minOrder: 2, desc: 'Organic kali mirch, Malabar origin' },
  { name: 'Cardamom', cat: 'Spices', price: 2000, qty: 30, grade: 'A', organic: true, shelf: 365, cold: false, minOrder: 1, desc: 'Green elaichi, premium grade' },
  // Dairy
  { name: 'Fresh Milk', cat: 'Dairy', price: 55, qty: 100, grade: 'A', organic: true, shelf: 1, cold: true, minOrder: 5, unit: 'L', desc: 'A2 milk, same-morning milking' },
  { name: 'Paneer', cat: 'Dairy', price: 320, qty: 50, grade: 'A', organic: true, shelf: 3, cold: true, minOrder: 2, unit: 'kg', desc: 'Fresh handmade paneer, full fat' },
  { name: 'Curd', cat: 'Dairy', price: 40, qty: 200, grade: 'A', organic: false, shelf: 3, cold: true, minOrder: 5, unit: 'kg', desc: 'Fresh dahi, set in earthen pots' },
  { name: 'Ghee', cat: 'Dairy', price: 500, qty: 30, grade: 'A', organic: true, shelf: 90, cold: false, minOrder: 1, unit: 'L', desc: 'A2 Desi Ghee, bilona method' },
  { name: 'Butter (Makhan)', cat: 'Dairy', price: 400, qty: 25, grade: 'A', organic: true, shelf: 14, cold: true, minOrder: 1, unit: 'kg', desc: 'White butter from curd, traditional churned' },
  // Processed
  { name: 'Honey', cat: 'Processed', price: 400, qty: 50, grade: 'A', organic: true, shelf: 365, cold: false, minOrder: 1, desc: 'Raw multiflower honey, unprocessed' },
  { name: 'Flour (Atta)', cat: 'Processed', price: 35, qty: 2000, grade: 'A', organic: false, shelf: 90, cold: false, minOrder: 10, desc: 'Sharbati wheat atta, stone-ground' },
  { name: 'Pickles (Achar)', cat: 'Processed', price: 150, qty: 100, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 2, desc: 'Homemade mixed pickle, mango-chili' },
  { name: 'Jaggery (Gur)', cat: 'Processed', price: 60, qty: 300, grade: 'A', organic: true, shelf: 180, cold: false, minOrder: 5, desc: 'Organic sugarcane gur, blocks' },
  { name: 'Papad', cat: 'Processed', price: 100, qty: 200, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 5, desc: 'Moong dal papad, sun-dried' },
  { name: 'Namkeen', cat: 'Processed', price: 120, qty: 150, grade: 'A', organic: false, shelf: 30, cold: false, minOrder: 2, desc: 'Freshly made aloo bhujia' },
  // Other
  { name: 'Mushroom', cat: 'Other', price: 100, qty: 80, grade: 'A', organic: false, shelf: 3, cold: true, minOrder: 2, desc: 'Button mushrooms, farm fresh' },
  { name: 'Sugarcane Juice', cat: 'Other', price: 25, qty: 200, grade: 'A', organic: false, shelf: 1, cold: true, minOrder: 10, unit: 'L', desc: 'Fresh pressed sugarcane, chilled' },
  // ─── Additional Vegetables ────────────────────────────────────
  { name: 'Drumstick (Moringa)', cat: 'Vegetables', price: 40, qty: 150, grade: 'A', organic: true, shelf: 5, cold: false, minOrder: 2, desc: 'Fresh moringa drumsticks, tender variety' },
  { name: 'Pointed Gourd (Parwal)', cat: 'Vegetables', price: 35, qty: 200, grade: 'A', organic: false, shelf: 4, cold: false, minOrder: 3, desc: 'Fresh parwal, green and tender' },
  { name: 'French Beans', cat: 'Vegetables', price: 45, qty: 180, grade: 'A', organic: true, shelf: 4, cold: true, minOrder: 2, desc: 'Fresh French beans, snapped and sorted' },
  { name: 'Fenugreek Leaves (Methi)', cat: 'Vegetables', price: 30, qty: 100, grade: 'A', organic: true, shelf: 2, cold: true, minOrder: 1, desc: 'Fresh methi leaves, same-morning harvest' },
  // ─── Additional Fruits ────────────────────────────────────────
  { name: 'Chikoo (Sapodilla)', cat: 'Fruits', price: 50, qty: 250, grade: 'A', organic: false, shelf: 7, cold: false, minOrder: 3, desc: 'Fresh chikoo, sweet and pulpy' },
  // ─── Additional Spices / Herbs ────────────────────────────────
  { name: 'Mint Leaves (Pudina)', cat: 'Spices', price: 25, qty: 80, grade: 'A', organic: true, shelf: 2, cold: true, minOrder: 1, desc: 'Fresh pudina leaves, aromatic' },
  { name: 'Curry Leaves', cat: 'Spices', price: 20, qty: 60, grade: 'A', organic: true, shelf: 3, cold: true, minOrder: 1, desc: 'Fresh curry leaves, from home garden' },
  { name: 'Cloves (Laung)', cat: 'Spices', price: 800, qty: 20, grade: 'A', organic: true, shelf: 365, cold: false, minOrder: 1, desc: 'Whole cloves, high oil content' },
  { name: 'Sesame Seeds (Til)', cat: 'Spices', price: 120, qty: 200, grade: 'A', organic: false, shelf: 180, cold: false, minOrder: 5, desc: 'White sesame seeds, cleaned' },
  { name: 'Fennel Seeds (Saunf)', cat: 'Spices', price: 150, qty: 120, grade: 'A', organic: false, shelf: 365, cold: false, minOrder: 2, desc: 'Sweet fennel seeds, good quality' },
  { name: 'Amla (Gooseberry)', cat: 'Fruits', price: 60, qty: 200, grade: 'A', organic: true, shelf: 7, cold: false, minOrder: 3, desc: 'Fresh amla, rich in Vitamin C' },
  { name: 'Tamarind (Imli)', cat: 'Other', price: 80, qty: 150, grade: 'A', organic: false, shelf: 90, cold: false, minOrder: 5, desc: 'Fresh tamarind pods, sweet variety' },
];

// ─── Demo account emails ────────────────────────────────────────
const DEMO_EMAILS = new Set([
  'farmer@demo.com', 'consumer@demo.com', 'buyer@demo.com',
  'fpo@demo.com', 'admin@demo.com', 'logistics@demo.com',
]);

async function seed() {
  console.log('🌱 Seeding KisanDirect AI database...\n');

  // ─── Clean all tables ──────────────────────────────────────────
  const tables = [
    // Global Trade (must be before User)
    'exportDocument', 'exportDocumentRequirement',
    'exportShipmentStatus', 'exportShipment', 'shippingEstimate',
    'exportOffer', 'supplyAggregationSupplier', 'supplyAggregation',
    'exportSupplierMatch', 'exportRFQItem', 'exportRFQ',
    'exportEligibility', 'exportReadinessProfile', 'globalProductListing',
    'globalBuyerProfile',
    // Core
    'HarvestPayment', 'HarvestAllocation', 'HarvestDelay', 'HarvestBuyerMatch',
    'HarvestReservation', 'ExpectedHarvestImage', 'ExpectedHarvest',
    'AuditLog', 'Verification', 'RiskScore', 'QualityAssessment',
    'PricePrediction', 'DemandForecast', 'MarketPrice', 'PriceHistory',
    'Favorite', 'Notification', 'Review', 'Dispute', 'CancellationPolicy',
    'Payment', 'Delivery', 'OrderClubMember', 'OrderClub',
    'OrderStatusHistory', 'OrderItem', 'Order', 'CartItem', 'Cart',
    'Offer', 'BuyerRequirement', 'ProductDeliveryRule', 'ProductImage',
    'Product', 'ProductCategory', 'LogisticsPartner',
    'ConsumerProfile', 'BuyerProfile', 'FPOProfile', 'FarmerProfile',
    'Crate', 'CollectionHub', 'User',
  ];
  for (const t of tables) {
    await (prisma as any)[t].deleteMany();
  }
  console.log('  🧹 Cleaned all tables');

  // ─── Categories ────────────────────────────────────────────────
  const cats: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const r = await prisma.productCategory.create({ data: c });
    cats[c.name] = r.id;
  }
  console.log(`  ✅ ${CATEGORIES.length} categories`);

  // ─── Farmers ───────────────────────────────────────────────────
  const farmerIds: string[] = [];
  for (const f of FARMERS) {
    const u = await prisma.user.create({
      data: {
        email: f.email, password: PW, name: f.name, role: 'FARMER',
        phone: `+91-${rand(7000000000, 9999999999)}`, isVerified: true, isActive: true,
      },
    });
    await prisma.farmerProfile.create({
      data: {
        userId: u.id, farmName: f.farm, latitude: f.lat, longitude: f.lng,
        city: f.city, specializations: JSON.stringify(f.specs),
        organicCertified: f.organic, trustScore: f.trust, farmSize: f.size,
        totalEarnings: rand(50000, 500000), completedOrders: rand(15, 120),
      },
    });
    farmerIds.push(u.id);
  }
  console.log(`  ✅ ${FARMERS.length} farmers`);

  // ─── Consumers ─────────────────────────────────────────────────
  const consumerIds: string[] = [];
  for (const c of CONSUMERS) {
    const u = await prisma.user.create({
      data: {
        email: c.email, password: PW, name: c.name, role: 'CONSUMER',
        phone: `+91-${rand(7000000000, 9999999999)}`, isVerified: true, isActive: true,
      },
    });
    await prisma.consumerProfile.create({
      data: {
        userId: u.id, defaultLatitude: c.lat, defaultLongitude: c.lng,
        defaultCity: c.city, defaultAddress: `${rand(1, 200)} ${pick(['MG Road', 'Station Road', 'Main Market', 'Sector ' + rand(1, 60), 'Ring Road', 'GT Road'])}, ${c.city}`,
      },
    });
    consumerIds.push(u.id);
  }
  console.log(`  ✅ ${CONSUMERS.length} consumers`);

  // ─── B2B Buyers ────────────────────────────────────────────────
  const buyerIds: string[] = [];
  for (const b of BUYERS) {
    const u = await prisma.user.create({
      data: {
        email: b.email, password: PW, name: b.name, role: 'B2B_BUYER',
        phone: `+91-${rand(7000000000, 9999999999)}`, isVerified: true, isActive: true,
      },
    });
    await prisma.buyerProfile.create({
      data: {
        userId: u.id, businessName: b.name, businessType: b.type,
        latitude: b.lat, longitude: b.lng, city: b.city,
        address: `${rand(1, 50)} ${pick(['Commercial Complex', 'Market Area', 'Shopping Center', 'Food Court'])}, ${b.city}`,
        trustScore: rand(75, 95),
      },
    });
    buyerIds.push(u.id);
  }
  console.log(`  ✅ ${BUYERS.length} B2B buyers`);

  // ─── FPOs ──────────────────────────────────────────────────────
  const fpoIds: string[] = [];
  for (const f of FPO_DATA) {
    const u = await prisma.user.create({
      data: {
        email: f.email, password: PW, name: f.name, role: 'FPO',
        phone: `+91-${rand(7000000000, 9999999999)}`, isVerified: true, isActive: true,
      },
    });
    await prisma.fPOProfile.create({
      data: {
        userId: u.id, fpoName: f.name, registrationNumber: `FPO-2024-${rand(100, 999)}`,
        memberCount: rand(20, 80), latitude: f.lat, longitude: f.lng, city: f.city,
        specializations: JSON.stringify(f.specs), trustScore: f.trust,
      },
    });
    fpoIds.push(u.id);
  }
  console.log(`  ✅ ${FPO_DATA.length} FPOs`);

  // ─── Admin + Logistics ─────────────────────────────────────────
  await prisma.user.create({
    data: { email: 'admin@demo.com', password: PW, name: 'Admin User', role: 'ADMIN', phone: '+91-9000000001', isVerified: true, isActive: true },
  });

  const logisticsIds: string[] = [];
  const logisticsNames = [
    { name: 'Rajesh Transport', company: 'QuickDeliver Partners', vehicles: ['Two Wheeler', 'Three Wheeler', 'Small Truck'] },
    { name: 'Meena Logistics', company: 'FreshRoute Express', vehicles: ['Small Truck', 'Tempo', 'Van'] },
    { name: 'Singh Cargo', company: 'GreenMove Logistics', vehicles: ['Three Wheeler', 'Tempo', 'Large Truck'] },
  ];
  for (const lp of logisticsNames) {
    const u = await prisma.user.create({
      data: {
        email: lp.company === 'QuickDeliver Partners' ? 'logistics@demo.com' : `${lp.company.toLowerCase().replace(/\s/g, '')}@demo.com`,
        password: PW, name: lp.name, role: 'LOGISTICS',
        phone: `+91-${rand(7000000000, 9999999999)}`, isVerified: true, isActive: true,
      },
    });
    await prisma.logisticsPartner.create({
      data: {
        userId: u.id, companyName: lp.company,
        vehicleTypes: JSON.stringify(lp.vehicles),
        coverageArea: JSON.stringify(['Delhi NCR', 'Haryana', 'UP']),
        isVerified: true, rating: round2(4 + Math.random()),
      },
    });
    logisticsIds.push(u.id);
  }
  // Collect LogisticsPartner IDs (not User IDs) for delivery.partnerId
  const logisticsPartnerIds: string[] = [];
  const allPartners = await prisma.logisticsPartner.findMany({ select: { id: true } });
  for (const p of allPartners) logisticsPartnerIds.push(p.id);
  console.log(`  ✅ Admin + ${logisticsNames.length} logistics partners`);

  // ─── Products ──────────────────────────────────────────────────
  const productIds: string[] = [];
  const productData: typeof PRODUCTS = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const farmerIdx = i % farmerIds.length;
    const product = await prisma.product.create({
      data: {
        name: p.name, description: p.desc, pricePerKg: p.price, unit: (p as any).unit || 'kg',
        availableQuantity: p.qty, minOrderQuantity: p.minOrder,
        qualityGrade: p.grade, organicCertified: p.organic,
        harvestDate: daysAgo(rand(0, 5)),
        shelfLife: p.shelf, coldChainRequired: p.cold,
        storageRequirement: p.cold ? 'Cold storage required' : 'Store in cool dry place',
        farmerId: farmerIds[farmerIdx], categoryId: cats[p.cat],
        avgRating: round2(3.5 + Math.random() * 1.5),
        totalSold: rand(30, 600),
      },
    });
    productIds.push(product.id);
    productData.push(p);

    // Create product image if available
    const imgUrl = PRODUCT_IMAGES[p.name];
    if (imgUrl) {
      await prisma.productImage.create({
        data: { productId: product.id, url: imgUrl, isPrimary: true },
      });
    }

    const maxRadius = p.cold ? 30 : p.cat === 'Grains' ? 100 : 50;
    await prisma.productDeliveryRule.create({
      data: {
        productId: product.id, deliveryMode: 'PLATFORM',
        maxDeliveryRadiusKm: maxRadius, interstateAllowed: p.cat === 'Grains',
        coldChainRequired: p.cold, maximumTransitHours: p.cold ? 12 : 48,
        sameDayRequired: p.cold,
      },
    });
  }
  console.log(`  ✅ ${PRODUCTS.length} products with delivery rules & ${Object.keys(PRODUCT_IMAGES).length} images`);

  // ─── Orders (120+) ────────────────────────────────────────────
  const ORDER_STATUSES = [
    { status: 'COMPLETED', weight: 30 },
    { status: 'IN_TRANSIT', weight: 10 },
    { status: 'DELIVERED', weight: 10 },
    { status: 'FARMER_ACCEPTED', weight: 15 },
    { status: 'PREPARING', weight: 10 },
    { status: 'ADVANCE_PAID', weight: 15 },
    { status: 'PENDING_ADVANCE', weight: 5 },
    { status: 'CANCELLED', weight: 5 },
  ];
  const weightedStatuses: string[] = [];
  for (const ws of ORDER_STATUSES) {
    for (let i = 0; i < ws.weight; i++) weightedStatuses.push(ws.status);
  }

  const orderIds: string[] = [];
  const completedOrderIds: string[] = [];

  // Mix B2B buyer orders with consumer orders so demo accounts have data
  for (let i = 0; i < 200; i++) {
    const productIdx = rand(0, productIds.length - 1);
    const p = productData[productIdx];
    // First 40 orders go to consumers (so demo consumer has orders),
    // remaining 80 go to B2B buyers
    const isConsumerOrder = i < 40;
    const buyerIdx = isConsumerOrder
      ? rand(0, consumerIds.length - 1)
      : rand(0, buyerIds.length - 1);
    const buyerId = isConsumerOrder ? consumerIds[buyerIdx] : buyerIds[buyerIdx];
    const farmerIdx = productIdx % farmerIds.length;
    const qty = rand(p.minOrder, Math.min(p.minOrder * 20, 300));
    const total = qty * p.price;
    const advance = Math.round(total * 0.2);
    const status = pick(weightedStatuses);
    const age = rand(0, 30);
    const buyerLoc = NCR[rand(0, NCR.length - 1)];

    const order = await prisma.order.create({
      data: {
        buyerId, farmerId: farmerIds[farmerIdx],
        productId: productIds[productIdx], quantity: qty, pricePerKg: p.price,
        totalAmount: total, advanceAmount: advance, remainingAmount: total - advance,
        platformFee: Math.round(total * 0.025),
        deliveryAddress: `${rand(1, 200)} ${pick(['MG Road', 'Main Street', 'Market Lane', 'Sector ' + rand(1, 60), 'Park Avenue', 'Civil Lines'])}, ${buyerLoc.city}`,
        deliveryLatitude: buyerLoc.lat + (Math.random() - 0.5) * 0.02,
        deliveryLongitude: buyerLoc.lng + (Math.random() - 0.5) * 0.02,
        status: status as any,
        createdAt: daysAgo(age),
        advancePaidAt: ['ADVANCE_PAID', 'FARMER_ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status) ? daysAgo(Math.max(0, age - 1)) : null,
        acceptedAt: ['FARMER_ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status) ? daysAgo(Math.max(0, age - 2)) : null,
        deliveredAt: ['DELIVERED', 'COMPLETED'].includes(status) ? daysAgo(Math.max(0, age - 3)) : null,
        completedAt: status === 'COMPLETED' ? daysAgo(Math.max(0, age - 4)) : null,
      },
    });
    orderIds.push(order.id);
    if (status === 'COMPLETED') completedOrderIds.push(order.id);

    // Status history
    let historyStatuses: string[] = ['PENDING_ADVANCE'];
    if (['ADVANCE_PAID', 'FARMER_ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status))
      historyStatuses.push('ADVANCE_PAID');
    if (['FARMER_ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status))
      historyStatuses.push('FARMER_ACCEPTED');
    if (['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status))
      historyStatuses.push('PREPARING');
    if (['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status))
      historyStatuses.push('IN_TRANSIT');
    if (['DELIVERED', 'COMPLETED'].includes(status))
      historyStatuses.push('DELIVERED');
    if (status === 'COMPLETED') historyStatuses.push('COMPLETED');
    if (status === 'CANCELLED') historyStatuses = ['PENDING_ADVANCE', 'CANCELLED'];

    for (const s of historyStatuses) {
      await prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: s as any, notes: `Order ${s.toLowerCase().replace(/_/g, ' ')}` },
      });
    }

    // Payment for paid orders
    if (status !== 'PENDING_ADVANCE') {
      await prisma.payment.create({
        data: {
          orderId: order.id, userId: buyerId, amount: advance,
          method: pick(['DEMO_UPI', 'DEMO_NETBANKING', 'DEMO_WALLET']),
          status: 'COMPLETED', transactionId: `TXN-${Date.now()}-${i}-${rand(1000, 9999)}`,
          platformFee: round2(advance * 0.025), farmerShare: round2(advance * 0.85),
          logisticsFee: round2(advance * 0.075),
        },
      });
    }

    // Remaining payment for completed orders
    if (status === 'COMPLETED') {
      await prisma.payment.create({
        data: {
          orderId: order.id, userId: buyerId, amount: total - advance,
          method: pick(['DEMO_UPI', 'DEMO_NETBANKING']),
          status: 'COMPLETED', transactionId: `TXN-${Date.now()}-${i}-R${rand(1000, 9999)}`,
          platformFee: round2((total - advance) * 0.025), farmerShare: round2((total - advance) * 0.85),
          logisticsFee: round2((total - advance) * 0.075),
        },
      });
    }

    // Delivery for shipped/completed orders
    if (['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status)) {
      const driverNames = ['Ramesh', 'Suresh', 'Ajay', 'Deepak', 'Vinod', 'Sanjay'];
      await prisma.delivery.create({
        data: {
          orderId: order.id,
          status: status === 'COMPLETED' ? 'DELIVERED' : status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
          driverName: pick(driverNames),
          driverPhone: `+91-${rand(7000000000, 9999999999)}`,
          vehicleNumber: `DL-${rand(10, 99)}-${pick(['AB', 'CD', 'EF', 'GH'])}-${rand(1000, 9999)}`,
          vehicleType: pick(['Small Truck', 'Three Wheeler', 'Tempo', 'Two Wheeler']),
          estimatedPickup: daysAgo(Math.max(0, age - 2)),
          estimatedArrival: daysAgo(Math.max(0, age - 3)),
          actualPickup: ['DELIVERED', 'COMPLETED'].includes(status) ? daysAgo(Math.max(0, age - 2)) : null,
          actualArrival: status === 'COMPLETED' ? daysAgo(Math.max(0, age - 3)) : null,
          partnerId: logisticsPartnerIds.length > 0 ? logisticsPartnerIds[rand(0, logisticsPartnerIds.length - 1)] : null,
        },
      });
    }
  }
  console.log(`  ✅ 200 orders with payments, history, and deliveries`);

  // ─── Reviews (on completed orders) ─────────────────────────────
  const reviewComments = [
    'Excellent quality! Will order again.',
    'Fresh produce, delivered on time.',
    'Very good, but packaging could be better.',
    'Top quality vegetables, highly recommended.',
    'Fair price and good quality.',
    'Slightly overripe but acceptable.',
    'Outstanding organic produce!',
    'Quick delivery, product was fresh.',
    'Good experience overall.',
    'The grain quality is premium.',
    'Milk was fresh and pure.',
    'Best paneer I have had in Delhi!',
    'Spices are authentic and aromatic.',
    'Fast delivery, good packaging.',
    'Consistent quality every time.',
  ];
  let reviewCount = 0;
  for (const oid of pickN(completedOrderIds, Math.min(80, completedOrderIds.length))) {
    const order = await prisma.order.findUnique({ where: { id: oid } });
    if (!order) continue;
    await prisma.review.create({
      data: {
        orderId: oid, productId: order.productId,
        reviewerId: order.buyerId, farmerId: order.farmerId,
        rating: rand(3, 5), comment: pick(reviewComments),
        reviewType: 'BUYER_TO_FARMER',
      },
    });
    reviewCount++;
  }
  console.log(`  ✅ ${reviewCount} reviews`);

  // ─── Buyer Requirements (active B2B demands) ───────────────────
  const requirements = [
    { product: 'Tomato', qty: 200, maxPrice: 26, days: 2 },
    { product: 'Onion', qty: 500, maxPrice: 20, days: 3 },
    { product: 'Potato', qty: 300, maxPrice: 16, days: 5 },
    { product: 'Paneer', qty: 30, maxPrice: 300, days: 1 },
    { product: 'Fresh Milk', qty: 50, maxPrice: 50, days: 1 },
    { product: 'Wheat', qty: 1000, maxPrice: 23, days: 7 },
    { product: 'Basmati Rice', qty: 500, maxPrice: 42, days: 7 },
    { product: 'Coriander', qty: 20, maxPrice: 100, days: 1 },
    { product: 'Green Chili', qty: 15, maxPrice: 40, days: 2 },
    { product: 'Cauliflower', qty: 50, maxPrice: 30, days: 2 },
  ];
  const requirementIds: string[] = [];
  for (const r of requirements) {
    const buyerId = pick(buyerIds);
    const buyerLoc = NCR[rand(0, NCR.length - 1)];
    const req = await prisma.buyerRequirement.create({
      data: {
        buyerId, productName: r.product, quantity: r.qty,
        maxPrice: r.maxPrice, quality: pick(['A', 'A+', 'B']),
        deliveryCity: buyerLoc.city,
        deliveryAddress: `${rand(1, 100)} ${pick(['Main Road', 'Market Area', 'Commercial Street'])}, ${buyerLoc.city}`,
        requiredByDate: daysAgo(-r.days),
        deliveryWindow: pick(['Morning 9-12', 'Afternoon 12-4', 'Evening 4-8', 'Any time']),
        notes: pick(['Urgent requirement', 'Regular weekly order', 'Bulk purchase', 'Event catering', '']),
        isActive: Math.random() > 0.3,
        createdAt: daysAgo(rand(0, 5)),
      },
    });
    requirementIds.push(req.id);
  }
  console.log(`  ✅ ${requirements.length} buyer requirements`);

  // ─── Offers on requirements ─────────────────────────────────────
  let offerCount = 0;
  for (const reqId of pickN(requirementIds, Math.min(8, requirementIds.length))) {
    const offerFarmers = pickN(farmerIds, rand(1, 3));
    for (const fId of offerFarmers) {
      await prisma.offer.create({
        data: {
          requirementId: reqId, farmerId: fId,
          pricePerKg: rand(18, 50), quantity: rand(10, 200),
          message: pick(['Freshly harvested', 'Can deliver same day', 'Organic certified', 'Best quality guaranteed', '']),
          status: pick(['PENDING', 'ACCEPTED', 'REJECTED']),
        },
      });
      offerCount++;
    }
  }
  console.log(`  ✅ ${offerCount} offers on requirements`);

  // ─── Favorites ─────────────────────────────────────────────────
  let favCount = 0;
  for (const cId of consumerIds) {
    const favFarmers = pickN(farmerIds, rand(1, 4));
    for (const fId of favFarmers) {
      try {
        await prisma.favorite.create({ data: { userId: cId, farmerId: fId } });
        favCount++;
      } catch {}
    }
  }
  console.log(`  ✅ ${favCount} favorites`);

  // ─── Notifications ─────────────────────────────────────────────
  const notifTemplates = [
    { title: 'Order Accepted', message: 'Your order has been accepted by the farmer.', type: 'ORDER' },
    { title: 'Payment Received', message: '₹{amount} advance payment received.', type: 'PAYMENT' },
    { title: 'Delivery Update', message: 'Your order is out for delivery.', type: 'DELIVERY' },
    { title: 'Clubbing Opportunity', message: '3 orders can be clubbed — save ₹190 on logistics!', type: 'CLUBBING' },
    { title: 'Order Delivered', message: 'Your order has been delivered successfully.', type: 'ORDER' },
    { title: 'New Order', message: 'You have a new order from {buyer}.', type: 'ORDER' },
    { title: 'Price Alert', message: 'Tomato prices have dropped to ₹24/kg in your area.', type: 'SYSTEM' },
    { title: 'High Demand Alert', message: 'High demand detected for {product} near your farm.', type: 'SYSTEM' },
    { title: 'Settlement Complete', message: 'Your settlement of ₹{amount} has been processed.', type: 'PAYMENT' },
    { title: 'Review Received', message: 'You received a {rating}-star review.', type: 'ORDER' },
    { title: 'Delivery Partner Assigned', message: 'Driver {driver} is heading to pick up your order.', type: 'DELIVERY' },
    { title: 'Refund Processed', message: 'Refund of ₹{amount} has been initiated.', type: 'PAYMENT' },
  ];
  let notifCount = 0;
  const allUserIds = [...farmerIds, ...consumerIds, ...buyerIds];
  for (const uid of allUserIds) {
    const count = rand(3, 8);
    for (let i = 0; i < count; i++) {
      const tmpl = pick(notifTemplates);
      await prisma.notification.create({
        data: {
          userId: uid, title: tmpl.title,
          message: tmpl.message
            .replace('{amount}', String(rand(200, 5000)))
            .replace('{buyer}', pick(['Hotel Fresh Picks', 'Spice Kitchen', 'Fresh Mart', 'Grand Plaza']))
            .replace('{product}', pick(['Tomato', 'Onion', 'Wheat', 'Milk']))
            .replace('{rating}', String(rand(4, 5)))
            .replace('{driver}', pick(['Ramesh', 'Suresh', 'Ajay', 'Deepak'])),
          type: tmpl.type as any,
          isRead: Math.random() > 0.4,
          createdAt: daysAgo(rand(0, 7)),
        },
      });
      notifCount++;
    }
  }
  console.log(`  ✅ ${notifCount} notifications`);

  // ─── Price History (30 days × 8 products) ──────────────────────
  const priceProducts = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Fresh Milk', 'Apple', 'Basmati Rice', 'Moong Dal'];
  let priceCount = 0;
  for (const pname of priceProducts) {
    const idx = PRODUCTS.findIndex(p => p.name === pname);
    if (idx < 0) continue;
    const basePrice = PRODUCTS[idx].price;
    for (let day = 0; day < 30; day++) {
      await prisma.priceHistory.create({
        data: {
          productId: productIds[idx],
          price: round2(basePrice * (0.8 + Math.random() * 0.4)),
          location: pick(['Delhi', 'Gurugram', 'Noida', 'Faridabad']),
          recordedAt: daysAgo(day),
        },
      });
      priceCount++;
    }
  }
  console.log(`  ✅ ${priceCount} price history records`);

  // ─── Market Prices ─────────────────────────────────────────────
  let marketCount = 0;
  for (const pname of priceProducts) {
    const basePrice = PRODUCTS.find(p => p.name === pname)?.price || 30;
    for (const loc of ['Delhi', 'Gurugram', 'Noida']) {
      await prisma.marketPrice.create({
        data: {
          product: pname, location: loc,
          avgPrice: basePrice, minPrice: round2(basePrice * 0.8),
          maxPrice: round2(basePrice * 1.2), date: daysAgo(0),
        },
      });
      marketCount++;
    }
  }
  console.log(`  ✅ ${marketCount} market prices`);

  // ─── Demand Forecasts ──────────────────────────────────────────
  const forecasts = [
    { product: 'Tomato', region: 'Delhi NCR', forecast: 'Demand expected to rise 15% next week due to festival season.', level: 'HIGH', change: 0.15, time: '1 week' },
    { product: 'Onion', region: 'Delhi NCR', forecast: 'Stable demand. Supply is adequate from MP and Rajasthan.', level: 'MODERATE', change: 0.02, time: '2 weeks' },
    { product: 'Potato', region: 'Haryana', forecast: 'Supply surplus expected from new harvest. Prices may drop.', level: 'LOW', change: -0.10, time: '1 week' },
    { product: 'Wheat', region: 'UP', forecast: 'Government procurement prices holding steady. Bulk demand from millers.', level: 'MODERATE', change: 0.05, time: '1 month' },
    { product: 'Fresh Milk', region: 'Delhi NCR', forecast: 'Summer demand peak. Cold chain capacity is a bottleneck.', level: 'HIGH', change: 0.20, time: '2 weeks' },
    { product: 'Mango', region: 'Delhi NCR', forecast: 'Season starting. Alphonso demand will peak in 3 weeks.', level: 'HIGH', change: 0.30, time: '3 weeks' },
    { product: 'Coriander', region: 'Delhi NCR', forecast: 'Leafy greens demand rising with summer. Supply tight.', level: 'HIGH', change: 0.12, time: '1 week' },
    { product: 'Moong Dal', region: 'Rajasthan', forecast: 'Harvest complete. Prices expected to stabilize.', level: 'MODERATE', change: -0.03, time: '2 weeks' },
  ];
  for (const f of forecasts) {
    await prisma.demandForecast.create({
      data: {
        product: f.product, region: f.region, forecast: f.forecast,
        demandLevel: f.level, expectedPriceChange: f.change, timeframe: f.time,
        createdAt: daysAgo(rand(0, 3)),
      },
    });
  }
  console.log(`  ✅ ${forecasts.length} demand forecasts`);

  // ─── Price Predictions ─────────────────────────────────────────
  for (const pname of priceProducts) {
    const idx = PRODUCTS.findIndex(p => p.name === pname);
    if (idx < 0) continue;
    const basePrice = PRODUCTS[idx].price;
    await prisma.pricePrediction.create({
      data: {
        productId: productIds[idx],
        predictedPrice: round2(basePrice * (0.9 + Math.random() * 0.2)),
        confidence: round2(0.7 + Math.random() * 0.25),
        trend: pick(['UPWARD', 'DOWNWARD', 'STABLE']),
        timeframe: pick(['1 week', '2 weeks', '1 month']),
      },
    });
  }
  console.log(`  ✅ ${priceProducts.length} price predictions`);

  // ─── Collection Hubs ───────────────────────────────────────────
  const hubs = [
    { name: 'Delhi Central Hub', lat: 28.6139, lng: 77.2090, city: 'New Delhi', cap: 2000 },
    { name: 'Noida Distribution Center', lat: 28.5355, lng: 77.3910, city: 'Noida', cap: 1500 },
    { name: 'Gurugram Cold Storage Hub', lat: 28.4595, lng: 77.0266, city: 'Gurugram', cap: 1000 },
    { name: 'Faridabad Grain Hub', lat: 28.4089, lng: 77.3178, city: 'Faridabad', cap: 3000 },
    { name: 'Ghaziabad Fresh Market Hub', lat: 28.6692, lng: 77.4538, city: 'Ghaziabad', cap: 1200 },
  ];
  for (const h of hubs) {
    await prisma.collectionHub.create({
      data: { name: h.name, latitude: h.lat, longitude: h.lng, city: h.city, capacity: h.cap },
    });
  }
  console.log(`  ✅ ${hubs.length} collection hubs`);

  // ─── Cancellation Policy ───────────────────────────────────────
  await prisma.cancellationPolicy.create({
    data: { name: 'Default', beforeAcceptance: 100, afterAcceptance: 90, afterPreparation: 75, afterLogistics: 50, afterPickup: 10, isActive: true },
  });
  await prisma.cancellationPolicy.create({
    data: { name: 'Dairy (Short Shelf Life)', beforeAcceptance: 100, afterAcceptance: 70, afterPreparation: 40, afterLogistics: 20, afterPickup: 0, isActive: true },
  });
  await prisma.cancellationPolicy.create({
    data: { name: 'Bulk Grains', beforeAcceptance: 100, afterAcceptance: 95, afterPreparation: 85, afterLogistics: 70, afterPickup: 50, isActive: true },
  });
  console.log('  ✅ 3 cancellation policies');

  // ─── Risk Scores ───────────────────────────────────────────────
  for (const uid of pickN([...farmerIds, ...consumerIds, ...buyerIds], 15)) {
    await prisma.riskScore.create({
      data: {
        userId: uid, score: rand(10, 90),
        factors: JSON.stringify(pickN(['order_frequency', 'cancellation_rate', 'payment_timeliness', 'review_sentiment', 'account_age', 'dispute_history'], 3)),
        riskLevel: pick(['LOW', 'LOW', 'MODERATE', 'HIGH']),
      },
    });
  }
  console.log('  ✅ 15 risk scores');

  // ═══ GLOBAL TRADE SEED DATA ═══════════════════════════════════
  console.log('\n🌐 Seeding Global Trade data...');

  // ─── International Buyers ──────────────────────────────────────
  const intlBuyerData = [
    { email: 'globalbuyer1@demo.com', name: 'Ahmed Al-Rashid', company: 'Al-Rashid Trading LLC', country: 'UAE', city: 'Dubai', port: 'Jebel Ali Port', type: 'IMPORTER', volume: '500+ MT/year' },
    { email: 'globalbuyer2@demo.com', name: 'Klaus Mueller', company: 'Mueller Agrar GmbH', country: 'Germany', city: 'Hamburg', port: 'Hamburg Port', type: 'IMPORTER', volume: '200+ MT/year' },
    { email: 'globalbuyer3@demo.com', name: 'Sarah Johnson', company: 'GreenLeaf Imports Ltd', country: 'United Kingdom', city: 'London', port: 'Felixstowe Port', type: 'IMPORTER', volume: '300+ MT/year' },
    { email: 'globalbuyer4@demo.com', name: 'Takeshi Yamamoto', company: 'AsiaFresh Corp', country: 'Japan', city: 'Tokyo', port: 'Tokyo Port', type: 'IMPORTER', volume: '150+ MT/year' },
    { email: 'globalbuyer5@demo.com', name: 'Fatima Al-Zahra', company: 'Gulf Spice Trading', country: 'Saudi Arabia', city: 'Jeddah', port: 'Jeddah Islamic Port', type: 'DISTRIBUTOR', volume: '400+ MT/year' },
    { email: 'globalbuyer6@demo.com', name: 'Pierre Dubois', company: 'French Agri Imports', country: 'France', city: 'Marseille', port: 'Port of Marseille', type: 'IMPORTER', volume: '250+ MT/year' },
    { email: 'globalbuyer7@demo.com', name: 'Mike Thompson', company: 'Pacific Harvest Trading', country: 'Australia', city: 'Sydney', port: 'Port Botany', type: 'IMPORTER', volume: '180+ MT/year' },
    { email: 'globalbuyer8@demo.com', name: 'Li Wei', company: 'Dragon Bridge Imports', country: 'China', city: 'Shanghai', port: 'Shanghai Port', type: 'IMPORTER', volume: '600+ MT/year' },
    { email: 'globalbuyer9@demo.com', name: 'Maria Garcia', company: 'Iberia Foods SA', country: 'Spain', city: 'Barcelona', port: 'Port of Barcelona', type: 'IMPORTER', volume: '200+ MT/year' },
    { email: 'globalbuyer10@demo.com', name: 'David Kim', company: 'Seoul Fresh Imports', country: 'South Korea', city: 'Busan', port: 'Busan Port', type: 'IMPORTER', volume: '120+ MT/year' },
  ];

  const globalUserIds: string[] = [];
  for (const b of intlBuyerData) {
    const u = await prisma.user.create({
      data: { email: b.email, password: PW, name: b.name, role: 'CONSUMER', phone: `+${rand(1, 99)}${rand(100000000, 999999999)}` },
    });
    globalUserIds.push(u.id);
    await prisma.globalBuyerProfile.create({
      data: {
        userId: u.id, companyName: b.company, country: b.country, city: b.city,
        portOrAirport: b.port, buyerType: b.type, annualVolume: b.volume,
        tradeExperience: pick(['5+ years', '10+ years', '3+ years', '7+ years']),
        preferredProducts: pick(['Spices, Grains', 'Rice, Pulses', 'Fruits, Vegetables', 'Turmeric, Chili, Cumin']),
        verificationStatus: pick(['VERIFIED_FOR_PLATFORM', 'DOCUMENTS_SUBMITTED', 'BASIC_PROFILE']),
      },
    });
  }
  console.log(`  ✅ ${intlBuyerData.length} international buyer profiles`);

  // ─── Export Readiness Profiles for Farmers ──────────────────────
  for (const fid of farmerIds.slice(0, 8)) {
    await prisma.exportReadinessProfile.create({
      data: {
        userId: fid,
        exportExperience: pick(['None - First time', '1-2 bulk orders', 'Domestic only', '3+ international orders']),
        annualCapacity: `${rand(50, 500)} MT`,
        packagingCapability: pick(['Standard bags (25/50 kg)', 'Custom packaging available', 'Bulk loose + bags', 'Retail + bulk packaging']),
        storageCapability: pick(['Warehouse on-farm', 'Rented cold storage', 'Open storage', 'Silo storage']),
        coldChainAvailable: Math.random() > 0.5,
        qualityInfo: pick(['A Grade, Graded + Packed', 'A/B Grade, Lab tested', 'Premium Organic, Certified', 'Standard quality, Washed + Sorted']),
        certifications: pick(['FSSAI, Organic India', 'FSSAI, APEDA', 'FSSAI, phytosanitary ready', 'None - pending application']),
        readinessStatus: pick(['VERIFIED_FOR_PLATFORM', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'BASIC_PROFILE']),
        preferredMarkets: pick(['UAE, Saudi Arabia', 'EU countries', 'Southeast Asia', 'Global - all markets']),
        previousBulkOrders: rand(0, 15),
      },
    });
  }
  console.log('  ✅ 8 export readiness profiles');

  // ─── Global Product Listings ────────────────────────────────────
  const globalProducts = [
    { name: 'Basmati Rice (1121)', cat: 'Grains', origin: 'Haryana', qty: 50000, moq: 5000, price: 180, grade: 'A+', pack: '25 kg vacuum bags', shelf: '12 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Turmeric Powder (Organic)', cat: 'Spices', origin: 'Tamil Nadu', qty: 30000, moq: 2000, price: 150, grade: 'A', pack: '25/50 kg HDPE bags', shelf: '18 months', export: 'EXPORT_ELIGIBLE_WITH_VERIFICATION', cold: false },
    { name: 'Red Chili Powder (Guntur)', cat: 'Spices', origin: 'Andhra Pradesh', qty: 25000, moq: 1000, price: 130, grade: 'A', pack: '25 kg bags', shelf: '12 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Alphonso Mango (Hapus)', cat: 'Fruits', origin: 'Maharashtra', qty: 15000, moq: 500, price: 450, grade: 'A', pack: '4.5 kg corrugated boxes', shelf: '14 days', export: 'EXPORT_POTENTIAL', cold: true },
    { name: 'Green Cardamom (8mm+)', cat: 'Spices', origin: 'Kerala', qty: 5000, moq: 500, price: 2200, grade: 'A+', pack: '5/10 kg vacuum bags', shelf: '24 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Cumin Seeds (Semi-Bold)', cat: 'Spices', origin: 'Rajasthan', qty: 20000, moq: 2000, price: 200, grade: 'A', pack: '25/50 kg bags', shelf: '18 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Organic Tur Dal', cat: 'Pulses', origin: 'Madhya Pradesh', qty: 40000, moq: 5000, price: 160, grade: 'A', pack: '50 kg organic bags', shelf: '12 months', export: 'EXPORT_ELIGIBLE_WITH_VERIFICATION', cold: false },
    { name: 'Fresh Pomegranate (Bhagwa)', cat: 'Fruits', origin: 'Maharashtra', qty: 20000, moq: 1000, price: 130, grade: 'A', pack: '4 kg trays', shelf: '30 days', export: 'EXPORT_POTENTIAL', cold: true },
    { name: 'Black Pepper (Tellicherry)', cat: 'Spices', origin: 'Kerala', qty: 8000, moq: 500, price: 750, grade: 'A', pack: '25 kg bags', shelf: '24 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Mustard Seeds (Yellow)', cat: 'Spices', origin: 'Rajasthan', qty: 35000, moq: 5000, price: 85, grade: 'A', pack: '50 kg bags', shelf: '12 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Long Grain Rice (Pusa)', cat: 'Grains', origin: 'Punjab', qty: 80000, moq: 10000, price: 80, grade: 'A', pack: '50 kg bags', shelf: '12 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Saffron (Mongra)', cat: 'Spices', origin: 'Jammu & Kashmir', qty: 500, moq: 50, price: 400000, grade: 'A+', pack: '1/5 g vacuum tins', shelf: '36 months', export: 'EXPORT_ELIGIBLE_WITH_VERIFICATION', cold: false },
    { name: 'A2 Gir Ghee', cat: 'Dairy', origin: 'Rajasthan', qty: 10000, moq: 500, price: 550, grade: 'A+', pack: '1/5/15 kg tins', shelf: '12 months', export: 'EXPORT_ELIGIBLE', cold: false },
    { name: 'Fresh Banana (Cavendish)', cat: 'Fruits', origin: 'Tamil Nadu', qty: 100000, moq: 10000, price: 30, grade: 'A', pack: '13.5 kg boxes', shelf: '7 days', export: 'LOCAL_ONLY', cold: true },
    { name: 'Chickpea Flour (Besan)', cat: 'Pulses', origin: 'Rajasthan', qty: 30000, moq: 5000, price: 70, grade: 'A', pack: '50 kg bags', shelf: '6 months', export: 'EXPORT_POTENTIAL', cold: false },
  ];

  const farmerExportIds = farmerIds.slice(0, 10);
  const globalProductIds: string[] = [];
  for (let i = 0; i < globalProducts.length; i++) {
    const gp = globalProducts[i];
    const pid = await prisma.globalProductListing.create({
      data: {
        farmerId: farmerExportIds[i % farmerExportIds.length],
        productName: gp.name, category: gp.cat,
        description: `Premium quality ${gp.name.toLowerCase()} from ${gp.origin}, India. Available for global bulk export.`,
        originState: gp.origin, countryOfOrigin: 'India',
        availableQuantity: gp.qty, unit: 'kg', moq: gp.moq,
        maxSupplyCapacity: gp.qty * 1.5, availableDate: '2026-10-01',
        harvestDate: '2026-09-15',
        upcomingHarvest: Math.random() > 0.5, advanceBooking: Math.random() > 0.3,
        qualityGrade: gp.grade, expectedPrice: gp.price, currency: 'INR',
        packagingOptions: gp.pack, shelfLife: gp.shelf,
        storageRequirement: gp.cold ? 'Cold chain required' : 'Dry, ventilated storage',
        coldChainRequired: gp.cold, domesticDelivery: true,
        exportStatus: gp.export, certifications: 'FSSAI, APEDA (where applicable)',
      },
    });
    globalProductIds.push(pid.id);
  }
  console.log(`  ✅ ${globalProducts.length} global product listings`);

  // ─── Export Eligibility Rules ───────────────────────────────────
  for (const pid of globalProductIds) {
    const destinations = ['UAE', 'Germany', 'United Kingdom', 'Japan', 'Saudi Arabia', 'France', 'Australia'];
    for (const dest of pickN(destinations, rand(2, 5))) {
      const feasible = Math.random() > 0.3;
      await prisma.exportEligibility.create({
        data: {
          productId: pid, destination: dest,
          status: feasible ? pick(['POTENTIALLY_FEASIBLE', 'VERIFIED']) : pick(['VERIFICATION_REQUIRED', 'NOT_SUPPORTED']),
          feasible,
          reasons: feasible ? 'Product meets basic export criteria' : 'Requires additional compliance documentation',
          requirements: JSON.stringify(feasible ? ['FSSAI License', 'Phytosanitary Certificate'] : ['APEDA Registration', 'Phytosanitary Certificate', 'Fumigation Certificate']),
        },
      });
    }
  }
  console.log('  ✅ export eligibility rules');

  // ─── RFQs ──────────────────────────────────────────────────────
  const rfqData = [
    { buyerIdx: 0, product: 'Basmati Rice (1121)', qty: 20000, dest: 'UAE', city: 'Dubai', timeline: 'November 2026', quality: 'A+, Extra Long Grain, 8% broken max', pkg: '50 kg vacuum bags', cold: false, price: 2.50, currency: 'USD' },
    { buyerIdx: 1, product: 'Turmeric Powder (Organic)', qty: 15000, dest: 'Germany', city: 'Hamburg', timeline: 'October 2026', quality: 'A Grade, 3-5% curcumin, Organic Certified', pkg: '25 kg HDPE bags', cold: false, price: 2.10, currency: 'EUR' },
    { buyerIdx: 2, product: 'Alphonso Mango (Hapus)', qty: 5000, dest: 'United Kingdom', city: 'London', timeline: 'June 2027', quality: 'A Grade, Alphonso variety, Ratnagiri origin', pkg: '4.5 kg corrugated boxes', cold: true, price: 7.50, currency: 'GBP' },
    { buyerIdx: 4, product: 'Red Chili Powder (Guntur)', qty: 10000, dest: 'Saudi Arabia', city: 'Jeddah', timeline: 'September 2026', quality: 'A Grade, Color 60-100 SHU, 5mm mesh', pkg: '25 kg bags', cold: false, price: 2.00, currency: 'SAR' },
    { buyerIdx: 7, product: 'Cumin Seeds (Semi-Bold)', qty: 25000, dest: 'China', city: 'Shanghai', timeline: 'November 2026', quality: 'A Grade, 99% purity, 98% admatter', pkg: '50 kg bags', cold: false, price: 3.00, currency: 'CNY' },
    { buyerIdx: 3, product: 'Green Cardamom (8mm+)', qty: 3000, dest: 'Japan', city: 'Tokyo', timeline: 'December 2026', quality: 'A+, 8mm+ size, bold capsules', pkg: '10 kg vacuum bags', cold: false, price: 35.00, currency: 'USD' },
    { buyerIdx: 5, product: 'Organic Tur Dal', qty: 20000, dest: 'France', city: 'Marseille', timeline: 'October 2026', quality: 'Organic Certified, A Grade, EU compliant', pkg: '25 kg organic-certified bags', cold: false, price: 2.30, currency: 'EUR' },
    { buyerIdx: 6, product: 'Fresh Pomegranate (Bhagwa)', qty: 8000, dest: 'Australia', city: 'Sydney', timeline: 'November 2026', quality: 'A Grade, Bhagwa variety, 200-250gm', pkg: '4 kg trays, clamshell', cold: true, price: 4.50, currency: 'AUD' },
    { buyerIdx: 8, product: 'Saffron (Mongra)', qty: 100, dest: 'Spain', city: 'Barcelona', timeline: 'January 2027', quality: 'A+, Mongra grade, ISO 3632 Category I', pkg: '1 g vacuum tins', cold: false, price: 5500, currency: 'USD' },
    { buyerIdx: 9, product: 'Long Grain Rice (Pusa)', qty: 30000, dest: 'South Korea', city: 'Busan', timeline: 'December 2026', quality: 'A Grade, 1121 Steam, 5% broken max', pkg: '50 kg bags', cold: false, price: 1.20, currency: 'USD' },
  ];

  const rfqIds: string[] = [];
  for (const r of rfqData) {
    const rfq = await prisma.exportRFQ.create({
      data: {
        buyerId: (await prisma.globalBuyerProfile.findUnique({ where: { userId: globalUserIds[r.buyerIdx] } }))!.id,
        productRequired: r.product, requiredQuantity: r.qty, unit: 'kg',
        destinationCountry: r.dest, destinationCity: r.city, deliveryTimeline: r.timeline,
        qualityRequirements: r.quality, packagingRequirements: r.pkg,
        coldChainRequired: r.cold, targetPrice: r.price, preferredCurrency: r.currency,
        additionalNotes: `Looking for reliable suppliers. Competitive pricing preferred.`,
        status: pick(['SUBMITTED', 'MATCHING', 'OFFERS_RECEIVED', 'ACCEPTED']),
      },
    });
    rfqIds.push(rfq.id);

    // RFQ Items
    await prisma.exportRFQItem.create({
      data: { rfqId: rfq.id, productName: r.product, quantity: r.qty, unit: 'kg', qualityGrade: r.quality.split(',')[0], specialReqs: r.pkg },
    });
  }
  console.log(`  ✅ ${rfqIds.length} RFQs`);

  // ─── Supplier Matches ───────────────────────────────────────────
  for (const rfqId of rfqIds.slice(0, 5)) {
    for (const fid of pickN(farmerExportIds, rand(3, 6))) {
      const pScore = rand(50, 98);
      const qScore = rand(40, 95);
      const qualScore = rand(55, 100);
      const tScore = rand(30, 90);
      const rScore = rand(40, 95);
      const lScore = rand(35, 85);
      const relScore = rand(50, 100);
      const avg = (pScore + qScore + qualScore + tScore + rScore + lScore + relScore) / 7;
      await prisma.exportSupplierMatch.create({
        data: {
          rfqId, farmerId: fid, matchScore: round2(avg),
          productScore: pScore, quantityScore: qScore, qualityScore: qualScore,
          timelineScore: tScore, readinessScore: rScore, locationScore: lScore, reliabilityScore: relScore,
          status: pick(['PENDING', 'VIEWED', 'SHORTLISTED', 'REJECTED']),
        },
      });
    }
  }
  console.log('  ✅ supplier matches');

  // ─── Supply Aggregations ────────────────────────────────────────
  for (const rfqId of rfqIds.slice(0, 3)) {
    const agg = await prisma.supplyAggregation.create({
      data: {
        rfqId, totalRequired: pick([10000, 15000, 20000]), totalAvailable: pick([10500, 16000, 22000]),
        matchPercentage: round2(rand(85, 100)),
        status: pick(['PROPOSED', 'REVIEWING', 'APPROVED']),
        consolidationHub: pick(['Panipat Collection Hub', 'Noida Consolidation Point', 'Gurugram Warehouse']),
        notes: 'Multi-farmer consolidation recommended for optimal logistics',
      },
    });
    for (const fid of pickN(farmerExportIds, 3)) {
      await prisma.supplyAggregationSupplier.create({
        data: {
          aggregationId: agg.id, farmerId: fid,
          quantity: pick([3000, 4000, 5000, 7000, 8000]),
          quality: pick(['A Grade', 'A+ Grade', 'A/B Grade']),
          location: pick(['Haryana', 'Punjab', 'Rajasthan', 'Madhya Pradesh']),
          exportReadiness: pick(['VERIFIED_FOR_PLATFORM', 'DOCUMENTS_SUBMITTED', 'BASIC_PROFILE']),
        },
      });
    }
  }
  console.log('  ✅ supply aggregations');

  // ─── Shipping Estimates ─────────────────────────────────────────
  const shippingMethods = ['SEA_FREIGHT', 'AIR_FREIGHT', 'TEMPERATURE_CONTROLLED'];
  for (const rfqId of rfqIds.slice(0, 5)) {
    for (const method of pickN(shippingMethods, 2)) {
      const base = method === 'AIR_FREIGHT' ? 80000 : method === 'SEA_FREIGHT' ? 25000 : 95000;
      const pkgCost = rand(5000, 15000);
      const inland = rand(8000, 25000);
      const handling = rand(3000, 8000);
      const freight = base + rand(-5000, 10000);
      const insurance = Math.round((pkgCost + inland + freight) * 0.02);
      const docCost = rand(2000, 5000);
      await prisma.shippingEstimate.create({
        data: {
          rfqId, shippingMethod: method,
          productValue: rand(100000, 500000), packagingCost: pkgCost,
          inlandTransport: inland, handlingCost: handling, freightCost: freight,
          insuranceCost: insurance, documentationCost: docCost,
          totalEstimate: pkgCost + inland + handling + freight + insurance + docCost,
          currency: 'USD',
          transitDays: method === 'SEA_FREIGHT' ? '15-25 days' : method === 'AIR_FREIGHT' ? '3-5 days' : '10-18 days',
          dataSource: 'DEMO_SIMULATED',
          notes: 'Estimated quote — final cost subject to carrier confirmation and shipment details.',
        },
      });
    }
  }
  console.log('  ✅ shipping estimates');

  // ─── Export Shipments ───────────────────────────────────────────
  for (const rfqId of rfqIds.slice(0, 2)) {
    const shipment = await prisma.exportShipment.create({
      data: {
        rfqId, status: pick(['CREATED', 'PREPARATION', 'READY_FOR_DISPATCH', 'SHIPPED']),
        shippingMethod: pick(['SEA_FREIGHT', 'AIR_FREIGHT']),
        trackingNumber: `EXP-${rand(100000, 999999)}`,
        estimatedDeparture: '2026-10-15', estimatedArrival: '2026-11-05',
        notes: 'Shipment under preparation',
      },
    });
    const statuses = ['CREATED', 'PREPARATION', 'DOCUMENTS_VERIFIED', 'READY_FOR_DISPATCH'];
    for (const s of statuses.slice(0, rand(1, 4))) {
      await prisma.exportShipmentStatus.create({
        data: { shipmentId: shipment.id, status: s, notes: `Shipment ${s.toLowerCase()}` },
      });
    }
  }
  console.log('  ✅ export shipments with status history');

  // ─── Export Document Requirements ───────────────────────────────
  const docReqs = [
    { name: 'FSSAI License', desc: 'Food Safety and Standards Authority of India license', cat: 'REGULATORY', prod: null, country: null },
    { name: 'Phytosanitary Certificate', desc: 'Certificate from Plant Quarantine', cat: 'REGULATORY', prod: null, country: null },
    { name: 'Certificate of Origin', desc: 'Origin certificate for the exporting country', cat: 'TRADE', prod: null, country: null },
    { name: 'APEDA Registration', desc: 'Agricultural and Processed Food Products Export Development Authority', cat: 'REGULATORY', prod: 'Spices', country: null },
    { name: 'Fumigation Certificate', desc: 'Mandatory for grain/spice exports', cat: 'QUALITY', prod: 'Grains,Spices', country: null },
    { name: 'Lab Test Report', desc: 'Quality and residue analysis', cat: 'QUALITY', prod: null, country: null },
    { name: 'Insurance Certificate', desc: 'Marine/transit insurance', cat: 'LOGISTICS', prod: null, country: null },
    { name: 'Halal Certificate', desc: 'Halal compliance certification', cat: 'COMPLIANCE', prod: null, country: 'Saudi Arabia,UAE' },
  ];
  const docReqIds: string[] = [];
  for (const d of docReqs) {
    const dr = await prisma.exportDocumentRequirement.create({
      data: { name: d.name, description: d.desc, category: d.cat, applicableProduct: d.prod, applicableCountry: d.country, required: true },
    });
    docReqIds.push(dr.id);
  }
  console.log(`  ✅ ${docReqs.length} document requirements`);

  // ─── Export Documents (some uploaded) ───────────────────────────
  for (const fid of farmerExportIds.slice(0, 5)) {
    for (const drId of pickN(docReqIds, rand(2, 5))) {
      const uploaded = Math.random() > 0.4;
      await prisma.exportDocument.create({
        data: {
          requirementId: drId, farmerId: fid,
          fileName: uploaded ? `${drId.slice(0, 8)}_${fid.slice(0, 8)}.pdf` : null,
          status: uploaded ? pick(['UPLOADED', 'UNDER_REVIEW', 'VERIFIED']) : 'NOT_UPLOADED',
        },
      });
    }
  }
  console.log('  ✅ export documents (sample)');

  // ─── Summary ───────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(), prisma.product.count(), prisma.order.count(),
    prisma.payment.count(), prisma.review.count(), prisma.notification.count(),
  ]);

  console.log('\n🎉 Database seeded successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   Users: ${counts[0]} | Products: ${counts[1]} | Orders: ${counts[2]}`);
  console.log(`   Payments: ${counts[3]} | Reviews: ${counts[4]} | Notifications: ${counts[5]}`);
  console.log(`\n📋 Demo Accounts (password: demo123):`);
  console.log(`   Consumer:  consumer@demo.com  (Priya Sharma, South Delhi)`);
  console.log(`   Farmer:    farmer@demo.com    (Rajesh Kumar, Rajesh Organic Farm, Gurugram)`);
  console.log(`   B2B Buyer: buyer@demo.com     (Hotel Fresh Picks, Connaught Place)`);
  console.log(`   FPO:       fpo@demo.com       (Green Valley FPO, Ghaziabad)`);
  console.log(`   Admin:     admin@demo.com     (Admin User)`);
  console.log(`   Logistics: logistics@demo.com (Rajesh Transport, QuickDeliver Partners)`);
  console.log(`\n   Additional farmers: farmer2@demo.com - farmer20@demo.com`);
  console.log(`   Additional consumers: consumer2@demo.com - consumer15@demo.com`);
  console.log(`   Additional buyers: buyer2@demo.com - buyer10@demo.com`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
