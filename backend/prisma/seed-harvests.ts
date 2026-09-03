import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const round2 = (n: number) => Math.round(n * 100) / 100;

const HARVEST_DATA = [
  // Farmer 1 (Rajesh Kumar) - 3 harvests
  {
    farmerEmail: 'farmer@demo.com',
    productName: 'Tomato',
    description: 'Premium organic tomatoes from Rajesh Organic Farm, Gurugram. Expected to be vine-ripened and hand-picked.',
    category: 'Vegetables',
    expectedDate: daysFromNow(8),
    expectedQty: 1000,
    unit: 'kg',
    grade: 'A',
    price: 30,
    minBooking: 10,
    maxPerBuyer: 200,
    lat: 28.4595, lng: 77.0266,
    deliveryRadius: 50,
    deliveryType: 'LOCAL',
    coldChain: false,
    advancePct: 20,
    bookingOpen: daysAgo(2),
    bookingClose: daysFromNow(6),
    notes: 'Organic certified. Expected harvest is weather-dependent.',
    status: 'BOOKING_OPEN',
  },
  {
    farmerEmail: 'farmer@demo.com',
    productName: 'Spinach',
    description: 'Fresh organic spinach, expected to be tender baby spinach leaves.',
    category: 'Vegetables',
    expectedDate: daysFromNow(5),
    expectedQty: 300,
    unit: 'kg',
    grade: 'A',
    price: 25,
    minBooking: 5,
    maxPerBuyer: 50,
    lat: 28.4595, lng: 77.0266,
    deliveryRadius: 30,
    deliveryType: 'LOCAL',
    coldChain: true,
    advancePct: 20,
    bookingOpen: daysAgo(1),
    bookingClose: daysFromNow(3),
    notes: 'Cold chain delivery required. Short shelf life after harvest.',
    status: 'BOOKING_OPEN',
  },
  {
    farmerEmail: 'farmer@demo.com',
    productName: 'Mango',
    description: 'Alphonso mangoes expected from our orchard. Ratnagiri quality.',
    category: 'Fruits',
    expectedDate: daysFromNow(20),
    expectedQty: 500,
    unit: 'kg',
    grade: 'A',
    price: 120,
    minBooking: 5,
    maxPerBuyer: 100,
    lat: 28.4595, lng: 77.0266,
    deliveryRadius: 50,
    deliveryType: 'LOCAL',
    coldChain: true,
    advancePct: 30,
    bookingOpen: daysAgo(3),
    bookingClose: daysFromNow(15),
    notes: 'Seasonal Alphonso mangoes. Price may vary based on final quality.',
    status: 'BOOKING_OPEN',
  },
  // Farmer 5 (Anita Devi) - 2 harvests
  {
    farmerEmail: 'farmer5@demo.com',
    productName: 'Wheat',
    description: 'Premium Sharbati wheat expected from 15 acres. Expected high yield.',
    category: 'Grains',
    expectedDate: daysFromNow(15),
    expectedQty: 5000,
    unit: 'kg',
    grade: 'A',
    price: 26,
    minBooking: 50,
    maxPerBuyer: 2000,
    lat: 28.9833, lng: 77.0167,
    deliveryRadius: 100,
    deliveryType: 'INTERSTATE',
    coldChain: false,
    advancePct: 15,
    bookingOpen: daysAgo(5),
    bookingClose: daysFromNow(10),
    notes: 'Long shelf life. Interstate delivery available.',
    status: 'BOOKING_OPEN',
  },
  {
    farmerEmail: 'farmer5@demo.com',
    productName: 'Guava',
    description: 'Allahabi guavas, seeded variety. Expected sweet and juicy.',
    category: 'Fruits',
    expectedDate: daysFromNow(7),
    expectedQty: 200,
    unit: 'kg',
    grade: 'A',
    price: 45,
    minBooking: 5,
    maxPerBuyer: 50,
    lat: 28.9833, lng: 77.0167,
    deliveryRadius: 50,
    deliveryType: 'LOCAL',
    coldChain: false,
    advancePct: 20,
    bookingOpen: daysAgo(1),
    bookingClose: daysFromNow(5),
    notes: 'Organic certified guavas.',
    status: 'BOOKING_OPEN',
  },
  // Farmer 4 (Ram Prasad - Dairy) - 1 harvest with delay
  {
    farmerEmail: 'farmer4@demo.com',
    productName: 'Fresh Milk',
    description: 'A2 milk from our 50-cow dairy farm. Expected fresh morning milking.',
    category: 'Dairy',
    expectedDate: daysFromNow(3),
    expectedQty: 200,
    unit: 'L',
    grade: 'A',
    price: 55,
    minBooking: 10,
    maxPerBuyer: 50,
    lat: 28.6700, lng: 76.9300,
    deliveryRadius: 30,
    deliveryType: 'LOCAL',
    coldChain: true,
    advancePct: 20,
    bookingOpen: daysAgo(2),
    bookingClose: daysFromNow(1),
    notes: 'Same-day milking. Cold chain mandatory.',
    status: 'DELAYED',
    actualQty: null, // delayed
    notes2: 'Originally expected in 3 days, delayed by 2 days due to veterinary inspection.',
  },
  // Farmer 10 (Meena Kumari) - 2 harvests, one fully reserved
  {
    farmerEmail: 'farmer10@demo.com',
    productName: 'Cauliflower',
    description: 'Fresh white cauliflower heads from Greater Noida organic farm.',
    category: 'Vegetables',
    expectedDate: daysFromNow(6),
    expectedQty: 400,
    unit: 'kg',
    grade: 'A',
    price: 38,
    minBooking: 10,
    maxPerBuyer: 100,
    lat: 28.4744, lng: 77.5040,
    deliveryRadius: 40,
    deliveryType: 'LOCAL',
    coldChain: false,
    advancePct: 20,
    bookingOpen: daysAgo(4),
    bookingClose: daysFromNow(4),
    notes: 'Organic certified. Expected good quality.',
    status: 'BOOKING_OPEN',
  },
  {
    farmerEmail: 'farmer10@demo.com',
    productName: 'Carrot',
    description: 'Sweet red carrots, seasonal organic produce.',
    category: 'Vegetables',
    expectedDate: daysFromNow(10),
    expectedQty: 300,
    unit: 'kg',
    grade: 'A',
    price: 32,
    minBooking: 5,
    maxPerBuyer: 80,
    lat: 28.4744, lng: 77.5040,
    deliveryRadius: 40,
    deliveryType: 'LOCAL',
    coldChain: false,
    advancePct: 20,
    bookingOpen: daysAgo(3),
    bookingClose: daysFromNow(7),
    notes: 'Sweet variety, seasonal.',
    status: 'BOOKING_OPEN',
  },
  // Farmer 15 (Lakshmi Nair) - 1 harvest with shortage example
  {
    farmerEmail: 'farmer15@demo.com',
    productName: 'Capsicum',
    description: 'Mixed color bell peppers. Expected red, yellow, and green varieties.',
    category: 'Vegetables',
    expectedDate: daysAgo(1),
    expectedQty: 250,
    unit: 'kg',
    grade: 'B',
    price: 42,
    minBooking: 5,
    maxPerBuyer: 60,
    lat: 28.5400, lng: 77.3950,
    deliveryRadius: 40,
    deliveryType: 'LOCAL',
    coldChain: false,
    advancePct: 20,
    bookingOpen: daysAgo(7),
    bookingClose: daysAgo(2),
    notes: 'Mixed variety bell peppers.',
    status: 'HARVEST_CONFIRMED',
    actualQty: 180,
    actualGrade: 'B',
  },
  // Farmer 30 (Kavita Sharma - New Delhi) - 1 harvest
  {
    farmerEmail: 'farmer30@demo.com',
    productName: 'Pomegranate',
    description: 'Nagpur ruby red pomegranates. Premium quality expected.',
    category: 'Fruits',
    expectedDate: daysFromNow(12),
    expectedQty: 150,
    unit: 'kg',
    grade: 'A',
    price: 155,
    minBooking: 3,
    maxPerBuyer: 40,
    lat: 28.6200, lng: 77.2200,
    deliveryRadius: 30,
    deliveryType: 'LOCAL',
    coldChain: false,
    advancePct: 25,
    bookingOpen: daysAgo(1),
    bookingClose: daysFromNow(10),
    notes: 'Premium quality. Organic.',
    status: 'BOOKING_OPEN',
  },
];

// Reservations for these harvests
const RESERVATIONS = [
  // Tomato harvest - 3 reservations
  { harvestIdx: 0, buyerEmail: 'buyer@demo.com', qty: 300, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
  { harvestIdx: 0, buyerEmail: 'buyer3@demo.com', qty: 200, addr: 'Noida Sector 62', lat: 28.54, lng: 77.39, ack: true },
  { harvestIdx: 0, buyerEmail: 'buyer4@demo.com', qty: 100, addr: 'Gurugram', lat: 28.46, lng: 77.03, ack: true },
  // Spinach - 2 reservations
  { harvestIdx: 1, buyerEmail: 'buyer@demo.com', qty: 50, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
  { harvestIdx: 1, buyerEmail: 'buyer7@demo.com', qty: 30, addr: 'South Delhi', lat: 28.52, lng: 77.20, ack: true },
  // Wheat - 4 reservations (big bulk)
  { harvestIdx: 3, buyerEmail: 'buyer@demo.com', qty: 1000, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
  { harvestIdx: 3, buyerEmail: 'buyer3@demo.com', qty: 500, addr: 'Noida', lat: 28.54, lng: 77.39, ack: true },
  { harvestIdx: 3, buyerEmail: 'buyer10@demo.com', qty: 800, addr: 'Delhi', lat: 28.62, lng: 77.21, ack: true },
  { harvestIdx: 3, buyerEmail: 'buyer5@demo.com', qty: 300, addr: 'Faridabad', lat: 28.41, lng: 77.32, ack: true },
  // Fresh Milk - 2 reservations
  { harvestIdx: 5, buyerEmail: 'buyer@demo.com', qty: 40, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
  { harvestIdx: 5, buyerEmail: 'buyer2@demo.com', qty: 30, addr: 'South Delhi', lat: 28.53, lng: 77.22, ack: true },
  // Cauliflower - 3 reservations
  { harvestIdx: 6, buyerEmail: 'buyer@demo.com', qty: 100, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
  { harvestIdx: 6, buyerEmail: 'buyer3@demo.com', qty: 80, addr: 'Noida', lat: 28.54, lng: 77.39, ack: true },
  { harvestIdx: 6, buyerEmail: 'buyer6@demo.com', qty: 50, addr: 'Ghaziabad', lat: 28.67, lng: 77.45, ack: true },
  // Capsicum (confirmed harvest) - 3 reservations
  { harvestIdx: 8, buyerEmail: 'buyer@demo.com', qty: 100, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
  { harvestIdx: 8, buyerEmail: 'buyer3@demo.com', qty: 80, addr: 'Noida', lat: 28.54, lng: 77.39, ack: true },
  { harvestIdx: 8, buyerEmail: 'buyer8@demo.com', qty: 70, addr: 'Noida', lat: 28.54, lng: 77.40, ack: true },
  // Pomegranate - 1 reservation
  { harvestIdx: 9, buyerEmail: 'buyer@demo.com', qty: 20, addr: 'Connaught Place', lat: 28.63, lng: 77.22, ack: true },
];

async function seedHarvests() {
  console.log('🌱 Seeding Harvest Reserve data...\n');

  // Clean harvest tables
  const tables = ['HarvestPayment', 'HarvestAllocation', 'HarvestDelay', 'HarvestBuyerMatch', 'HarvestReservation', 'ExpectedHarvestImage', 'ExpectedHarvest'];
  for (const t of tables) {
    await (prisma as any)[t].deleteMany();
  }
  console.log('  🧹 Cleaned harvest tables');

  // Get farmer and buyer IDs
  const farmers: Record<string, string> = {};
  const buyers: Record<string, string> = {};
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const u of allUsers) {
    if (u.email.startsWith('farmer')) farmers[u.email] = u.id;
    if (u.email.startsWith('buyer') && !u.email.includes('logistics')) buyers[u.email] = u.id;
  }

  // Create harvests
  const harvestIds: string[] = [];
  for (let i = 0; i < HARVEST_DATA.length; i++) {
    const h = HARVEST_DATA[i];
    const farmerId = farmers[h.farmerEmail];
    if (!farmerId) { console.log(`  ⚠️ Farmer ${h.farmerEmail} not found, skipping`); continue; }

    const cat = await prisma.productCategory.findFirst({ where: { name: h.category } });

    const harvest = await prisma.expectedHarvest.create({
      data: {
        farmerId,
        productName: h.productName,
        description: h.description,
        categoryId: cat?.id,
        expectedHarvestDate: h.expectedDate,
        expectedQuantity: h.expectedQty,
        unit: h.unit,
        qualityGrade: h.grade,
        expectedPricePerUnit: h.price,
        minBookingQuantity: h.minBooking,
        maxBookingPerBuyer: h.maxPerBuyer,
        farmLatitude: h.lat,
        farmLongitude: h.lng,
        deliveryRadiusKm: h.deliveryRadius,
        deliveryType: h.deliveryType,
        coldChainRequired: h.coldChain,
        advanceBookingEnabled: true,
        advancePercentage: h.advancePct,
        bookingOpenDate: h.bookingOpen,
        bookingCloseDate: h.bookingClose,
        notes: (h as any).notes2 || h.notes,
        status: h.status as any,
        actualHarvestedQuantity: (h as any).actualQty || null,
        actualQualityGrade: (h as any).actualGrade || null,
        totalReservedQuantity: 0,
      },
    });
    harvestIds.push(harvest.id);
    console.log(`  ✅ Harvest: ${h.productName} (${h.expectedQty} ${h.unit}) for ${h.farmerEmail}`);
  }

  // Create reservations
  let totalAdvance = 0;
  for (const r of RESERVATIONS) {
    const harvestId = harvestIds[r.harvestIdx];
    if (!harvestId) continue;
    const buyerId = buyers[r.buyerEmail];
    if (!buyerId) continue;

    const harvest = HARVEST_DATA[r.harvestIdx];
    const totalValue = r.qty * harvest.price;
    const advance = Math.round(totalValue * (harvest.advancePct / 100));

    // Distance calculation
    const R = 6371;
    const dLat = ((harvest.lat - r.lat) * Math.PI) / 180;
    const dLng = ((harvest.lng - r.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((r.lat * Math.PI) / 180) * Math.cos((harvest.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    const deliveryCharge = Math.round(100 + dist * 18 + (harvest.coldChain ? 50 : 0));

    const reservation = await prisma.harvestReservation.create({
      data: {
        harvestId,
        buyerId,
        quantity: r.qty,
        pricePerUnit: harvest.price,
        advancePercentage: harvest.advancePct,
        advanceAmount: advance,
        totalValue,
        deliveryAddress: `${r.addr}, NCR`,
        deliveryLatitude: r.lat,
        deliveryLongitude: r.lng,
        estimatedDeliveryKm: dist,
        deliveryCharge,
        acknowledged: r.ack,
        status: harvest.status === 'HARVEST_CONFIRMED' ? 'FULFILLED' : 'CONFIRMED',
        advancePaymentStatus: 'PAID',
      },
    });

    // Create advance payment
    await prisma.harvestPayment.create({
      data: {
        reservationId: reservation.id,
        amount: advance,
        type: 'ADVANCE',
        method: 'DEMO_UPI',
        status: 'COMPLETED',
        transactionId: `HRV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    });

    totalAdvance += advance;

    // Update harvest reserved quantity
    await prisma.expectedHarvest.update({
      where: { id: harvestId },
      data: { totalReservedQuantity: { increment: r.qty } },
    });
  }
  console.log(`  ✅ ${RESERVATIONS.length} reservations with ₹${totalAdvance.toLocaleString()} total advance`);

  // Create delay record for the delayed milk harvest
  if (harvestIds[5]) {
    await prisma.harvestDelay.create({
      data: {
        harvestId: harvestIds[5],
        originalDate: daysAgo(2),
        newDate: daysFromNow(3),
        reason: 'Veterinary inspection required for dairy herd',
        reasonType: 'OPERATIONAL',
      },
    });
    console.log('  ✅ Delay record for Fresh Milk harvest');
  }

  // Create shortage allocation for capsicum (harvest confirmed with less than reserved)
  if (harvestIds[8]) {
    const capsReservations = RESERVATIONS.filter(r => r.harvestIdx === 8);
    for (const r of capsReservations) {
      const harvest = HARVEST_DATA[8];
      const expectedQty = r.qty;
      const adjustedQty = Math.round((r.qty * 180 / 250) * 100) / 100;
      const adjustedTotal = adjustedQty * harvest.price;
      const adjustedAdvance = Math.round(adjustedTotal * (harvest.advancePct / 100));
      const originalAdvance = Math.round(expectedQty * harvest.price * (harvest.advancePct / 100));
      const refund = originalAdvance - adjustedAdvance;

      // Find the reservation
      const buyerId = buyers[r.buyerEmail];
      if (!buyerId) continue;
      const existingRes = await prisma.harvestReservation.findFirst({
        where: { harvestId: harvestIds[8], buyerId },
      });
      if (!existingRes) continue;

      await prisma.harvestReservation.update({
        where: { id: existingRes.id },
        data: {
          adjustedQuantity: adjustedQty,
          adjustedAdvance,
          adjustedTotalValue: adjustedTotal,
          refundAmount: Math.max(0, refund),
          status: 'ADJUSTED',
        },
      });

      await prisma.harvestAllocation.create({
        data: {
          harvestId: harvestIds[8],
          reservationId: existingRes.id,
          buyerId,
          expectedQuantity: expectedQty,
          adjustedQuantity: adjustedQty,
          allocationType: 'PROPORTIONAL',
          reason: `Shortage: 180 kg harvested vs 250 kg reserved`,
        },
      });

      if (refund > 0) {
        await prisma.harvestPayment.create({
          data: {
            reservationId: existingRes.id,
            amount: refund,
            type: 'REFUND',
            method: 'DEMO_UPI',
            status: 'COMPLETED',
            transactionId: `HRV-RF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          },
        });
      }
    }
    console.log('  ✅ Shortage allocation for Capsicum harvest (250→180 kg)');
  }

  // Summary
  const counts = await Promise.all([
    prisma.expectedHarvest.count(),
    prisma.harvestReservation.count(),
    prisma.harvestPayment.count(),
  ]);
  console.log(`\n🎉 Harvest Reserve data seeded!`);
  console.log(`   Harvests: ${counts[0]} | Reservations: ${counts[1]} | Payments: ${counts[2]}`);
}

seedHarvests().catch(console.error).finally(() => prisma.$disconnect());
