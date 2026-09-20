/* Seed realistic cold storage facilities near Delhi NCR */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FACILITIES = [
  {
    name: 'Azadpur Cold Chain Hub',
    operator: 'Azadpur Agri Logistics Pvt Ltd',
    latitude: 28.7071, longitude: 77.1704, city: 'Delhi',
    address: 'Plot 14, Azadpur Mandi Complex, Delhi',
    capacityKg: 200000, availableCapacityKg: 125000,
    storageType: 'COLD_ROOM', tempMinC: 2, tempMaxC: 8,
    supportedCrops: ['Potato', 'Apple', 'Onion', 'Tomato', 'Carrot', 'Peas'],
    pricePerKgPerDay: 1.2, minQuantityKg: 100, maxDurationDays: 180,
    rating: 4.6, reviewCount: 84, isVerified: true,
    contactPhone: '+91 98100 12345', operatingHours: 'Mon-Sat 6:00-22:00',
    rules: 'No mixed-crop pallets. Quality check at entry. Deposit refundable on withdrawal.',
  },
  {
    name: 'Gurugram FreshStore Kold',
    operator: 'FreshStore India',
    latitude: 28.4595, longitude: 77.0266, city: 'Gurugram',
    address: 'Sector 33 Industrial Area, Gurugram, Haryana',
    capacityKg: 80000, availableCapacityKg: 42000,
    storageType: 'CONTROLLED_ATMOSPHERE', tempMinC: 0, tempMaxC: 4,
    supportedCrops: ['Apple', 'Tomato', 'Capsicum', 'Cauliflower', 'Broccoli'],
    pricePerKgPerDay: 1.8, minQuantityKg: 50, maxDurationDays: 120,
    rating: 4.8, reviewCount: 132, isVerified: true,
    contactPhone: '+91 98110 22334', operatingHours: '24x7',
    rules: 'CA chambers. Ethylene-sensitive crops segregated. Door-to-door pickup available.',
  },
  {
    name: 'Sonipat Potato Vault',
    operator: 'Haryana Cold Chain Co-op',
    latitude: 28.9933, longitude: 77.0154, city: 'Sonipat',
    address: 'GT Road, Sonipat, Haryana',
    capacityKg: 500000, availableCapacityKg: 310000,
    storageType: 'COLD_ROOM', tempMinC: 2, tempMaxC: 6,
    supportedCrops: ['Potato', 'Onion', 'Garlic', 'Ginger'],
    pricePerKgPerDay: 0.9, minQuantityKg: 500, maxDurationDays: 240,
    rating: 4.3, reviewCount: 56, isVerified: true,
    contactPhone: '+91 94670 55443', operatingHours: 'Mon-Sun 5:00-22:00',
    rules: 'Bulk sacks only (50kg). Fumigation schedule every 30 days.',
  },
  {
    name: 'Karnal Agri Freezer Point',
    operator: 'Karnal Cold Services',
    latitude: 29.6901, longitude: 76.9602, city: 'Karnal',
    address: 'Industrial Estate, Karnal, Haryana',
    capacityKg: 150000, availableCapacityKg: 8000,
    storageType: 'FROZEN', tempMinC: -18, tempMaxC: -10,
    supportedCrops: ['Peas', 'Sweet Corn', 'Pulps', 'Dairy'],
    pricePerKgPerDay: 2.5, minQuantityKg: 200, maxDurationDays: 90,
    rating: 4.1, reviewCount: 38, isVerified: false,
    contactPhone: '+91 94162 77889', operatingHours: 'Mon-Sat 7:00-21:00',
    rules: 'Blast-freeze available at extra cost. Verification pending.',
  },
  {
    name: 'Noida Veggie Fresh Cold Hub',
    operator: 'Noida Fresh Logistics',
    latitude: 28.5802, longitude: 77.3188, city: 'Noida',
    address: 'Phase 2, Noida Special Economic Zone, UP',
    capacityKg: 100000, availableCapacityKg: 65000,
    storageType: 'COLD_ROOM', tempMinC: 3, tempMaxC: 10,
    supportedCrops: ['Tomato', 'Onion', 'Potato', 'Spinach', 'Coriander', 'Brinjal'],
    pricePerKgPerDay: 1.4, minQuantityKg: 50, maxDurationDays: 150,
    rating: 4.4, reviewCount: 71, isVerified: true,
    contactPhone: '+91 98730 65412', operatingHours: 'Mon-Sun 6:00-23:00',
    rules: 'Leafy greens max 15 days. Crate-based storage preferred.',
  },
  {
    name: 'Meerut Kisan Bhandar Cold Storage',
    operator: 'Meerut Kisan Society',
    latitude: 28.9845, longitude: 77.7064, city: 'Meerut',
    address: 'Delhi Road, Meerut, UP',
    capacityKg: 300000, availableCapacityKg: 0,
    storageType: 'COLD_ROOM', tempMinC: 2, tempMaxC: 8,
    supportedCrops: ['Potato', 'Wheat', 'Rice', 'Pulses', 'Onion'],
    pricePerKgPerDay: 0.75, minQuantityKg: 300, maxDurationDays: 200,
    rating: 3.9, reviewCount: 45, isVerified: true,
    contactPhone: '+91 93540 12987', operatingHours: 'Mon-Sun 6:00-20:00',
    rules: 'Seasonal rates apply Nov-Feb. Currently full for potato season.',
  },
];

async function main() {
  const existing = await prisma.coldStorageFacility.count();
  if (existing > 0) {
    console.log(`Cold storage seed skipped — ${existing} facilities already present`);
    return;
  }

  for (const f of FACILITIES) {
    await prisma.coldStorageFacility.create({
      data: { ...f, supportedCrops: JSON.stringify(f.supportedCrops) },
    });
  }
  console.log(`✅ Seeded ${FACILITIES.length} cold storage facilities`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
