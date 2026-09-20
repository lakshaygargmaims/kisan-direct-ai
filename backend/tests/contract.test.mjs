// ═══════════════════════════════════════════════════════════════
// KISAN DIRECT AI — Cold Storage & Orders: executable contract
// One suite, one flow. Run: node tests/contract.test.mjs
// Self-healing: preamble clears Garlic test batches and restores
// facility capacity, so the suite is re-runnable after any outcome.
// ═══════════════════════════════════════════════════════════════
import { PrismaClient } from '@prisma/client';

const BASE = 'http://localhost:3001';
const prisma = new PrismaClient();

let passed = 0, failed = 0;
const failures = [];
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; failures.push({ name, error: e.message }); console.log(`  ❌ ${name}: ${e.message}`); }
}
async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, ...(await res.json().catch(() => ({}))) };
}
async function login(email, password = 'demo123') {
  const r = await req('POST', '/api/auth/login', { email, password });
  const token = r.data?.token;
  if (!token) throw new Error(`login failed for ${email}`);
  return token;
}

// ── Cleanup: availableCapacity = capacity − Σ(active batch qty). ──
async function restoreCapacity(facilityId) {
  const f = await prisma.coldStorageFacility.findUnique({ where: { id: facilityId } });
  const used = await prisma.storedBatch.aggregate({
    _sum: { currentQtyKg: true },
    where: { facilityId },
  });
  await prisma.coldStorageFacility.update({
    where: { id: facilityId },
    data: { availableCapacityKg: f.capacityKg - (used._sum.currentQtyKg || 0) },
  });
}
async function deleteBatch(id) {
  const b = await prisma.storedBatch.findUnique({ where: { id } });
  if (!b) return;
  // Products referenced by orders are history — only order-free ones go.
  await prisma.product.deleteMany({
    where: { name: { startsWith: 'Garlic (Cold Storage' }, orders: { none: {} } },
  });
  await prisma.storedBatch.delete({ where: { id } });
  await restoreCapacity(b.facilityId);
}
async function cleanupLeftovers() {
  const stale = await prisma.storedBatch.findMany({
    where: { productName: 'Garlic' },
    select: { id: true, facilityId: true },
  });
  for (const b of stale) await deleteBatch(b.id);
}

const farmerT = await login('farmer@demo.com');
const consumerT = await login('consumer@demo.com');
await cleanupLeftovers();

// ── Garlic is the test crop: exactly one facility supports it ──
const facs = (await req('GET', '/api/cold-storage/facilities?crop=Garlic&radius=500')).data.facilities;
assert(facs.length === 1, `expected 1 Garlic facility, got ${facs.length}`);
const facility = facs[0];

console.log('\n📋 QUOTE BOUNDARIES (price = qty × rate × days)');
const quoteCases = [
  ['happy path 500×15 → exact math + calculation string', { quantityKg: 500, durationDays: 15 }, (r, q) => {
    assert(Math.abs(q.storageCost - Math.round(500 * q.ratePerKgPerDay * 15 * 100) / 100) < 0.01, `storageCost ${q.storageCost}`);
    assert(q.calculation.includes('500 kg'), 'calculation string');
  }],
  ['below min quantity → 400', { quantityKg: 1, durationDays: 5 }, (r) => assert(r.status === 400 && /Minimum quantity/i.test(r.error))],
  ['above available capacity → 400', { quantityKg: 99999999, durationDays: 5 }, (r) => assert(r.status === 400 && /available/i.test(r.error))],
  ['above max duration → 400', { quantityKg: 500, durationDays: 99999 }, (r) => assert(r.status === 400 && /Maximum storage duration/i.test(r.error))],
];
for (const [name, body, check] of quoteCases) {
  await test(`quote: ${name}`, async () => {
    const r = await req('POST', `/api/cold-storage/facilities/${facility.id}/quote`, { productName: 'Garlic', ...body });
    check(r, r.data);
  });
}

console.log('\n📦 BOOKING & AUTH BOUNDARIES');
const booking = { facilityId: facility.id, productName: 'Garlic', quantityKg: 500, durationDays: 10, qualityGrade: 'A' };
let batchId, productId, qrToken, batchCode;
await test('farmer books 500kg → PAID, batch code format, capacity −500', async () => {
  const capBefore = (await req('GET', `/api/cold-storage/facilities/${facility.id}`)).data.availableCapacityKg;
  const r = await req('POST', '/api/cold-storage/bookings', booking, farmerT);
  assert(r.status === 200, JSON.stringify(r).slice(0, 250));
  batchId = r.data.batch.id;
  batchCode = r.data.batch.batchCode; qrToken = r.data.batch.qrToken;
  assert(/^KDA-GAR-\d{4}-\d{6}$/.test(batchCode), `bad code ${batchCode}`);
  assert(r.data.booking.paymentStatus === 'PAID', 'not paid');
  const capAfter = (await req('GET', `/api/cold-storage/facilities/${facility.id}`)).data.availableCapacityKg;
  assert(Math.abs(capBefore - capAfter - 500) < 0.01, `capacity ${capBefore}→${capAfter}`);
});
await test('no token → 401; consumer (wrong role) → 403', async () => {
  assert((await req('POST', '/api/cold-storage/bookings', booking)).status === 401);
  assert((await req('POST', '/api/cold-storage/bookings', booking, consumerT)).status === 403);
});

console.log('\n🤖 AI SELLING INSIGHT (estimates, never guarantees)');
await test('insight: price>0, range ordered, real source, disclaimer, sellNow math', async () => {
  const r = await req('POST', '/api/cold-storage/ai-insight', { productName: 'Garlic', quantityKg: 500 }, farmerT);
  assert(r.status === 200, JSON.stringify(r).slice(0, 200));
  const d = r.data;
  assert(d.currentMarketPrice > 0, 'no price');
  assert(d.estimatedPriceRange.low <= d.estimatedPriceRange.high, 'range inverted');
  assert(['LIVE_PLATFORM_DATA', 'RECENT_ORDERS', 'CURRENT_LISTINGS', 'MANDI_REFERENCE', 'DEMO_FALLBACK'].includes(d.priceDataSource), `source ${d.priceDataSource}`);
  assert(/NOT a guaranteed price/i.test(d.disclaimer), 'disclaimer missing');
  assert(Math.abs(d.sellNow.grossRevenue - 500 * d.currentMarketPrice) < 0.01, 'sellNow math');
});

console.log('\n🛒 LIST → ORDER LIFECYCLE (batch ⇄ marketplace sync)');
await test('list all 500 in one listing → FULLY_LISTED, product 500kg', async () => {
  const r = await req('POST', `/api/cold-storage/batches/${batchId}/sell`, { quantityKg: 500, pricePerKg: 40 }, farmerT);
  assert(r.status === 200, JSON.stringify(r).slice(0, 250));
  productId = r.data.product.id;
  assert(r.data.batch.listedQtyKg === 500 && r.data.batch.status === 'FULLY_LISTED');
});
await test('over-list beyond 0 remaining → 400', async () => {
  const r = await req('POST', `/api/cold-storage/batches/${batchId}/sell`, { quantityKg: 100, pricePerKg: 40 }, farmerT);
  assert(r.status === 400 && /available to list/i.test(r.error), r.error);
});
await test('consumer orders 240 → money math + batch sync (500→260)', async () => {
  const r = await req('POST', '/api/orders', {
    productId, quantity: 240,
    deliveryAddress: 'Contract Test Lane', deliveryLatitude: 28.4595, deliveryLongitude: 77.0266,
  }, consumerT);
  assert(r.status === 200 || r.status === 201, JSON.stringify(r).slice(0, 250));
  const o = r.data.order || r.data;
  assert(Number(o.totalAmount) === 240 * 40, `total ${o.totalAmount}`);
  assert(Number(o.advanceAmount) === 240 * 40 * 0.2, `advance ${o.advanceAmount}`);
  const b = (await req('GET', `/api/cold-storage/batches/${batchId}`, null, farmerT)).data;
  assert(b.currentQtyKg === 260 && b.listedQtyKg === 260 && b.soldQtyKg === 240, `qty ${b.currentQtyKg} listed ${b.listedQtyKg} sold ${b.soldQtyKg}`);
  assert(b.status === 'PARTIALLY_SOLD', b.status);
});
await test('order remainder 260 → SOLD_OUT; further orders → 400', async () => {
  const r = await req('POST', '/api/orders', {
    productId, quantity: 260,
    deliveryAddress: 'Contract Test Lane 42', deliveryLatitude: 28.4595, deliveryLongitude: 77.0266,
  }, consumerT);
  assert(r.status < 300, `remainder order failed: ${JSON.stringify(r).slice(0, 250)}`);
  const b = (await req('GET', `/api/cold-storage/batches/${batchId}`, null, farmerT)).data;
  assert(b.currentQtyKg === 0 && b.status === 'SOLD_OUT', `qty ${b.currentQtyKg} ${b.status}`);
  assert((await req('POST', '/api/orders', {
    productId, quantity: 10,
    deliveryAddress: 'x', deliveryLatitude: 28.4595, deliveryLongitude: 77.0266,
  }, consumerT)).status === 400);
});

console.log('\n⚔️  CONCURRENCY (atomic inventory — the release blockers)');
await test('RACE orders: 3×250kg vs 500 stock → exactly 2 succeed', async () => {
  const rb = await req('POST', '/api/cold-storage/bookings', { ...booking, durationDays: 5 }, farmerT);
  assert(rb.data?.batch, `booking failed: ${JSON.stringify(rb).slice(0, 200)}`);
  const b2 = rb.data.batch.id;
  const s = await req('POST', `/api/cold-storage/batches/${b2}/sell`, { quantityKg: 500, pricePerKg: 40 }, farmerT);
  assert(s.data?.product, `sell failed: ${JSON.stringify(s).slice(0, 200)}`);
  const pid = s.data.product.id;
  const payload = () => req('POST', '/api/orders', {
    productId: pid, quantity: 250,
    deliveryAddress: 'Race Lane', deliveryLatitude: 28.4595, deliveryLongitude: 77.0266,
  }, consumerT);
  const results = await Promise.all([payload(), payload(), payload()]);
  const ok = results.filter((r) => r.status === 200 || r.status === 201);
  console.log(`    → statuses [${results.map((r) => r.status).join(', ')}]`);
  assert(ok.length === 2, `expected exactly 2 successes, got ${ok.length}`);
  const fin = (await req('GET', `/api/cold-storage/batches/${b2}`, null, farmerT)).data;
  assert(fin.soldQtyKg === 500 && fin.listedQtyKg === 0 && fin.status === 'SOLD_OUT', `sold ${fin.soldQtyKg} listed ${fin.listedQtyKg}`);
  await deleteBatch(b2);
});
await test('RACE sells: 2×300kg for last 300 → exactly 1 succeeds', async () => {
  const rb = await req('POST', '/api/cold-storage/bookings', { ...booking, durationDays: 5 }, farmerT);
  const b3 = rb.data.batch.id;
  const first = await req('POST', `/api/cold-storage/batches/${b3}/sell`, { quantityKg: 200, pricePerKg: 40 }, farmerT);
  assert(first.data.batch.status === 'PARTIALLY_LISTED', first.data.batch.status); // partial-list status
  const [a, b] = await Promise.all([
    req('POST', `/api/cold-storage/batches/${b3}/sell`, { quantityKg: 300, pricePerKg: 24 }, farmerT),
    req('POST', `/api/cold-storage/batches/${b3}/sell`, { quantityKg: 300, pricePerKg: 26 }, farmerT),
  ]);
  const ok = [a, b].filter((r) => r.status === 200);
  assert(ok.length === 1, `got ${ok.length} successes`);
  const fin = (await req('GET', `/api/cold-storage/batches/${b3}`, null, farmerT)).data;
  assert(fin.listedQtyKg === 500, `listed ${fin.listedQtyKg}`);
  await deleteBatch(b3);
});
await test('RACE withdrawals: 2 concurrent → 1 succeeds, capacity credited once', async () => {
  const rb = await req('POST', '/api/cold-storage/bookings', { ...booking, durationDays: 5 }, farmerT);
  assert(rb.data?.batch, `booking failed: ${JSON.stringify(rb).slice(0, 200)}`);
  const b4 = rb.data.batch.id;
  // Baseline AFTER booking, so the window isolates the withdraw effect
  const capBefore = (await req('GET', `/api/cold-storage/facilities/${facility.id}`)).data.availableCapacityKg;
  const [a, b] = await Promise.all([
    req('POST', `/api/cold-storage/batches/${b4}/withdraw`, null, farmerT),
    req('POST', `/api/cold-storage/batches/${b4}/withdraw`, null, farmerT),
  ]);
  const ok = [a, b].filter((r) => r.status === 200);
  assert(ok.length === 1, `got ${ok.length} successes`);
  const capAfter = (await req('GET', `/api/cold-storage/facilities/${facility.id}`)).data.availableCapacityKg;
  assert(Math.abs(capAfter - capBefore - 500) < 0.01, `capacity drift ${capBefore}→${capAfter}`);
});
await test('withdraw blocked while listings active', async () => {
  const rb = await req('POST', '/api/cold-storage/bookings', { ...booking, durationDays: 5 }, farmerT);
  assert(rb.data?.batch, `booking failed: ${JSON.stringify(rb).slice(0, 200)}`);
  const b5 = rb.data.batch.id;
  await req('POST', `/api/cold-storage/batches/${b5}/sell`, { quantityKg: 200, pricePerKg: 40 }, farmerT);
  const w = await req('POST', `/api/cold-storage/batches/${b5}/withdraw`, null, farmerT);
  assert(w.status === 400 && /active listings/i.test(w.error), w.error);
  await deleteBatch(b5);
});

console.log('\n🔒 QR TRACEABILITY (public-safe)');
await test('trace by token: no farmer PII, facility shown', async () => {
  const r = await req('GET', `/api/cold-storage/trace/${qrToken}`);
  assert(r.status === 200 && r.data.batchCode === batchCode, 'trace failed');
  const s = JSON.stringify(r.data);
  assert(!/farmer@demo|Rajesh/i.test(s), 'PII leaked');
  assert(r.data.facilityName, 'no facility');
});

console.log('\n🔎 INVENTORY READ MODEL');
await test('batches list: computed fields (daysStored, availableToSell)', async () => {
  const rb = await req('POST', '/api/cold-storage/bookings', { ...booking, durationDays: 5 }, farmerT);
  assert(rb.data?.batch, `booking failed: ${JSON.stringify(rb).slice(0, 200)}`);
  const b6 = rb.data.batch.id;
  const list = (await req('GET', '/api/cold-storage/batches', null, farmerT)).data.batches;
  const mine = list.find((x) => x.id === b6);
  assert(mine, 'batch missing from list');
  assert(mine.daysStored >= 0 && mine.daysRemaining > 0, 'day math');
  assert(mine.availableToSell === 500, `availableToSell ${mine.availableToSell}`);
  assert((await req('GET', '/api/cold-storage/batches', null, consumerT)).status === 403, 'consumer sees batches');
  await deleteBatch(b6);
});

// ── Leave the world as we found it ──
await prisma.product.deleteMany({ where: { name: { startsWith: 'Garlic (Cold Storage' }, orders: { none: {} } } });
await prisma.storedBatch.deleteMany({ where: { productName: 'Garlic' } });
await restoreCapacity(facility.id);
await prisma.$disconnect();

console.log(`\n${'='.repeat(50)}`);
console.log(`  Contract: ${passed} passed, ${failed} failed / ${passed + failed}`);
failures.forEach((f) => console.log(`    ❌ ${f.name}: ${f.error}`));
console.log('='.repeat(50));
process.exit(failed > 0 ? 1 : 0);
