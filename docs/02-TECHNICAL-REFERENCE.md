# KisanDirect AI — Technical Reference

Part 2 of 3. Covers: API reference, database reference, authentication & authorization, security, AI architecture, external integrations, deployment & Docker, installation guide, environment variables, and folder structure.

Status legend: 🟢 implemented · 🟡 partial · 🔵 planned.

---

## 1. API Reference

All endpoints live under `/api`, served by the same process as the UI in production. Authentication is JWT Bearer unless noted. Validation is Zod on every body/query. Error shape is always `{ success: false, error }`; success shape `{ success: true, data }`.

Route files (14): `auth`, `products`, `orders`, `payments`, `logistics`, `admin`, `notifications`, `map`, `demand`, `harvests`, `ai`, `global`, `mandi`, `cold-storage`.

### 1.1 Auth — `/api/auth`

| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/register` | Create account | — | bcrypt hash; duplicate email → 400 |
| POST | `/login` | Issue JWT | — | invalid → 401 |
| GET | `/me` | Current user profile | JWT | |

### 1.2 Products — `/api/products`

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/` | Search/filter/paginate marketplace | — |
| GET | `/:id` | Product detail incl. images, category, farmer | — |
| POST | `/` | Create product | FARMER/FPO |
| PUT | `/:id` | Update product | FARMER/FPO (owner) |
| DELETE | `/:id` | Delete product (blocked when orders exist) | FARMER/FPO (owner) |

### 1.3 Orders — `/api/orders`

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/` | Create order (total & 20% advance computed server-side) | CONSUMER/B2B_BUYER |
| GET | `/` | List my orders (role-scoped) | JWT |
| GET | `/:id` | Order detail + status history + payments | JWT (party) |
| PATCH | `/:id/status` | Advance lifecycle status | FARMER (owner) |
| POST | `/:id/cancel` | Cancel + policy refund + stock restore (exactly once) | CONSUMER/ADMIN |

### 1.4 Payments — `/api/payments`

| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/create` | Record advance/remaining payment | JWT (order buyer) | Amount/status re-checked server-side; double payment → 400 |
| POST | `/refund` | Refund (admin/demo provider) | ADMIN | providerReference logged |
| GET | `/order/:orderId` | Payments for an order | JWT (party) | |

### 1.5 Logistics — `/api/logistics`

| Method | Endpoint | Purpose | Auth |
|--------|----------|--------|------|
| POST | `/quote` | Distance-based delivery quote (demo provider) | JWT |
| POST | `/shipments` | Create shipment, assign vehicle (demo) | FARMER/ADMIN |
| GET | `/shipments/:id` | Tracking detail | JWT |
| GET | `/dashboard` | Logistics partner view of assigned shipments | LOGISTICS |

### 1.6 Cold Storage — `/api/cold-storage`

| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|--------|------|-------|
| GET | `/facilities` | Search by crop/radius/location | — | distance computed server-side (haversine) |
| GET | `/facilities/:id` | Facility detail + live available capacity | — | |
| POST | `/facilities/:id/quote` | Cost = qty × rate × days | — | 400s: min qty / capacity / max duration |
| POST | `/bookings` | Book → capacity decrement + `StorageBooking` + `StoredBatch` (+qrToken) | FARMER | race-tested atomic |
| GET | `/bookings` | My bookings | FARMER | |
| GET | `/batches` | Stored inventory w/ computed fields (daysStored, daysRemaining, availableToSell, accumulated cost) | FARMER | |
| GET | `/batches/:id` | Batch detail | FARMER (owner) | |
| POST | `/batches/:id/sell` | List qty as marketplace product; batch ⇄ product sync | FARMER (owner) | over-list → 400 |
| POST | `/batches/:id/withdraw` | Withdraw unlisted qty; capacity credit exactly once; blocked with active listings | FARMER (owner) | |
| POST | `/ai-insight` | Sell-now vs sell-later estimate | FARMER | mandatory disclaimer |
| GET | `/trace/:qrToken` | **Public** traceability: batch, dates, facility, grade — no PII | — | PII-leak tested |

### 1.7 AI — `/api/ai`

| Method | Endpoint | Purpose | Auth |
|--------|----------|--------|------|
| POST | `/fair-price/predict` | Fair-price estimate from 90-day orders + live listings + season factor | JWT |
| POST | `/demand-forecast/predict` | N-day forecast from day-of-week patterns in 60-day orders | JWT |
| POST | `/farmer-recommendation/rank` | Rank farmers for buyers | JWT |

### 1.8 Harvests — `/api/harvests`

Expected-harvest declarations, images, reservations, allocations, delays, buyer matches, harvest payments. Full CRUD surface for the pre-booking workflow. Auth: FARMER/FPO + buyer endpoints.

### 1.9 Global Trade — `/api/global`

Global buyer profiles, global product listings, export eligibility & readiness, RFQs (+ items), supplier matches, supply aggregation, export offers, shipping estimates, export shipments (+ status events), export document requirements + documents. Primary actors: B2B_BUYER, ADMIN.

### 1.10 Remaining modules

| Router | Highlights |
|--------|-----------|
| `/api/map` | `/farmers`, `/buyers`, `/hubs`, `/demand` — geo feeds for MapLibre maps |
| `/api/demand` | Demand zones, product demand, snapshots |
| `/api/mandi` | 🟡 static APMC dataset (data.gov.in-derived) + `/compare/:productName` platform-vs-mandi |
| `/api/notifications` | In-app notification list/read |
| `/api/admin` | Users, products, orders, disputes, verification, audit log — ADMIN only |

All 96 endpoints enumerated with request/response examples: see the contract suite (`backend/tests/contract.test.mjs`) which doubles as an executable API reference.

---

## 2. Database Reference

**Engine:** SQLite (dev) / PostgreSQL 18 (prod). **ORM:** Prisma 5.10. Two schemas derive from one source: `schema.prisma` → `schema.prod.prisma` (generated at Docker build by `scripts/prepare-postgres.mjs`).

**65 models**, grouped by domain. String enums are validated in Zod/application code.

**Identity & profiles (6):** `User` (id cuid, email unique, passwordHash, role `CONSUMER|FARMER|FPO|B2B_BUYER|LOGISTICS|ADMIN`, isVerified, isActive), `FarmerProfile`, `FPOProfile`, `ConsumerProfile`, `BuyerProfile`, `LogisticsPartner`.

**Catalog (5):** `ProductCategory`, `Product` (name, description, pricePerKg, availableQuantity, qualityGrade, isActive, farm location lat/lng), `ProductImage`, `ProductDeliveryRule`, `Favorite`.

**Orders & payments (7):** `Order` (quantity, pricePerKg, totalAmount, **advanceAmount = 20%**, remainingAmount, platformFee, status, deliveryAddress + lat/lng, buyerId→User, farmerId→User, productId→Product), `OrderItem`, `OrderStatusHistory`, `Payment` (type advance/remaining/refund, amount, providerReference), `CancellationPolicy`, `Dispute`, `OrderClub` / `OrderClubMember` (logistics clubbing).

**Delivery (1):** `Delivery` (provider DEMO, quote, tracking status, vehicle, ETA).

**Cold storage (4):** `ColdStorageFacility` (name, operator, lat/lng, capacityKg, availableCapacityKg, storageType, temp range, supportedCrops JSON, pricePerKgPerDay, minQuantityKg, maxDurationDays, rating, isVerified, contact), `StorageBooking` (quantityKg, durationDays, amount, paymentStatus), `StoredBatch` (batchCode `KDA-XXX-YYYY-NNNNNN` unique, initialQtyKg, currentQtyKg, listedQtyKg, soldQtyKg, status `STORED|PARTIALLY_LISTED|FULLY_LISTED|PARTIALLY_SOLD|SOLD_OUT|WITHDRAWN`, qrToken, harvestDate, qualityGrade), `StoragePayment`.

**Harvest pre-booking (7):** `ExpectedHarvest`, `ExpectedHarvestImage`, `HarvestReservation`, `HarvestAllocation`, `HarvestDelay`, `HarvestBuyerMatch`, `HarvestPayment`.

**Global trade (14):** `GlobalBuyerProfile`, `GlobalProductListing`, `ExportEligibility`, `ExportReadinessProfile`, `ExportRFQ`, `ExportRFQItem`, `ExportSupplierMatch`, `SupplyAggregation`, `SupplyAggregationSupplier`, `ExportOffer`, `ShippingEstimate`, `ExportShipment`, `ExportShipmentStatus`, `ExportDocumentRequirement`, `ExportDocument`.

**Market intelligence (8):** `PriceHistory`, `MarketPrice`, `DemandForecast`, `PricePrediction`, `DemandZone`, `ProductDemand`, `DemandSnapshot`, `QualityAssessment`.

**Platform ops (8):** `Notification`, `Review`, `BuyerRequirement`, `Offer`, `CollectionHub`, `Crate`, `RiskScore`, `Verification`, `AuditLog`.

**Relationship rules (verified behaviorally by tests):**

- `User 1—* Order` (as buyer and as farmer); `Product 1—* Order`
- `ColdStorageFacility 1—* StorageBooking 1—1 StoredBatch 1—0..1 Product`
- Batch quantities satisfy `initialQtyKg = currentQtyKg + soldQtyKg` at all times (sold decrements current, listing moves current→listed); capacity conservation `capacityKg = availableCapacityKg + Σ active batch qty`
- Cancellations restore `Product.availableQuantity` inside the same transaction that sets status — double-cancel returns 400, stock restored exactly once
- `deleteProduct` is blocked when orders reference the product (history preservation)

---

## 3. Authentication & Authorization

🟢 Implemented, verified.

```text
Register: Zod validation → duplicate check → bcrypt.hashSync(pw, 10) → User row
Login:    Zod validation → user lookup → bcrypt.compare → JWT.sign(
            { userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
Request:  Authorization: Bearer <token>
   → authenticate(): jwt.verify → req.user = { userId, email, role }
   → authorize(...roles): role ∈ roles else 403
```

- Passwords: bcrypt (10 rounds) — never stored or logged in plain text
- Tokens: HS256 JWT, 7-day expiry default; role travels in the token and is re-checked per route
- Client storage: token held by the SPA (Zustand auth store) and attached by the Axios instance
- Route protection: 96 endpoints declare their auth requirement; cold-storage batches are strictly owner-scoped (cross-farmer access tested → rejected)

---

## 4. Security

Honest assessment, per audit:

| Control | Status | Detail |
|---|---|---|
| Password hashing (bcrypt) | 🟢 | 10 rounds; no plaintext paths found |
| JWT authentication | 🟢 | Signed, expiring, role-carrying |
| Role authorization | 🟢 | `authorize()` on every protected router; wrong-role → 403 (tested) |
| Input validation | 🟢 | Zod schemas on all 14 routers (10 schema files); ZodError → 400 with details |
| SQL injection | 🟢 | Prisma parameterized queries throughout; no raw SQL |
| Server-side money math | 🟢 | Totals, advance, refunds, storage quotes computed from DB values; client amounts never trusted (tampered-amount tested → rejected) |
| Double-payment / double-cancel protection | 🟢 | Status re-checks inside transactions (tested) |
| Atomic inventory (oversell) | 🟢 | DB transactions + guarded updates; 3 concurrent-race tests pass locally and in production |
| CORS | 🟢 | Custom allow-list: same-origin, FRONTEND_URL, CORS_ORIGINS, *.vercel.app, localhost dev |
| Secrets management | 🟢 | `.env` git-ignored; prod secrets set as Railway variables; random `JWT_SECRET` generated at deploy; `.env.example` contains placeholders only |
| IDOR / object-level authz | 🟢 | Owner checks on batches/products/orders (tested cross-role) |
| PII protection in public endpoints | 🟢 | `/trace/:qrToken` exposes no farmer identity (regex-tested) |
| Rate limiting | 🟡 | `express-rate-limit` installed but **not wired into the app** — recommended before public launch |
| CSRF | 🟡 | JWT-in-header (not cookies) makes classic CSRF largely inapplicable; no CSRF middleware present |
| HTTPS | 🟢 | Terminated by Railway edge |
| Security headers (helmet) | 🔵 | Not installed — recommended |
| Refresh tokens / revocation | 🔵 | Not implemented; 7-day static JWT |

**Verified attack outcomes:** wrong password 401 · bogus token 401 · consumer booking farmer endpoint 403 · tampered payment amount rejected · double payment 400 · oversell 400 · cross-farmer batch access rejected.

---

## 5. AI Architecture

🟢 **Implemented as in-process statistical models over the platform's own data** — no external AI API is called, and no model training is claimed. (`AI_SERVICE_URL` exists in config but is unused — 🟡 dead config, flagged in the quality audit.)

### Figure 5.1 — AI data flow

```text
Farmer/Buyer UI
   → POST /api/ai/{fair-price | demand-forecast | farmer-rank}
      → Prisma queries: real Orders (90d / 60d window) + live Product listings
      → statistical computation:
          fair-price:  avg 90d selling price ⊕ avg listing price
                       × seasonal factor (spring 1.05 · summer 0.95 ·
                         monsoon 1.10 · winter 1.00)
                       → point estimate + range
          demand:      day-of-week demand pattern → next-N-day forecast
          farmer-rank: fulfillment & quality signals → ranked list
      → JSON { estimate, range, dataSource, disclaimer }
   → UI renders estimate + "NOT a guaranteed price" disclaimer
```

**Data sources by priority (observed in code):** `LIVE_PLATFORM_DATA` → `RECENT_ORDERS` → `CURRENT_LISTINGS` → `MANDI_REFERENCE` → `DEMO_FALLBACK`. The `dataSource` field is returned to the UI so the origin of every number is visible.

**Cold-storage AI selling insight:** computes current market price, estimated price range, storage-cost deduction (qty × rate × days), and sell-now vs sell-later comparison from real batch + order data — always with the disclaimer, and its `sellNow.grossRevenue = qty × currentPrice` math is contract-tested.

**Honest limitations:** linear/seasonal statistics, not learned ML; sparse-data products fall back to labeled demo references; predictions are estimates with uncertainty, never guarantees.

---

## 6. External Integrations

| Service | Purpose | Status | Integration | Failure handling |
|---|---|---|---|---|
| Railway PostgreSQL 18 | Production database | 🟢 | `DATABASE_URL` via Railway variable | Prisma connect errors surface as 500 with logged context |
| data.gov.in APMC prices | Mandi price reference | 🟡 | **Static dataset** in `mandi.routes.ts` (comment marks the production intent) | N/A — offline data |
| MapLibre raster tiles | Map rendering (4 map screens) | 🟢 | Public tile style, no key | Map renders without user geolocation; manual location input |
| Payment provider (Razorpay) | Real payments | 🔵 config-ready | Keys plumbed via env; provider = demo | Demo provider simulates success/failure |
| Porter logistics API | Live dispatch | 🔵 config-ready | `PORTER_API_KEY` in config; provider = demo | Demo provider computes distance-based quotes internally |
| Geocoding / routing APIs | Address → coords | 🔵 config-ready | Keys in env config; demo fallback computes haversine directly | Coordinates accepted directly from client forms |

All provider selection is via `*_PROVIDER` env vars; no keys are ever sent to the frontend.

---

## 7. Deployment & Docker

### Figure 7.1 — Deployment architecture (as running)

```text
GitHub (main) ──push──▶ codebase
                          │
                    railway up (or GitHub auto-deploy 🔵)
                          ▼
             ┌─────────────────────────────┐
             │ Railway project             │
             │  ┌───────────────────────┐  │
             │  │ Service: kisan-direct-│  │
             │  │ ai  (Docker, 3-stage) │  │
             │  │  /api/health ✓        │  │
             │  │  restart on failure   │  │
             │  └──────────┬────────────┘  │
             │             │ internal net  │
             │  ┌──────────▼────────────┐  │
             │  │ PostgreSQL 18         │  │
             │  │ (volume-backed)       │  │
             │  └───────────────────────┘  │
             └─────────────────────────────┘
                          │
                https://kisan-direct-ai-production-4899.up.railway.app
```

**Dockerfile (3 stages):**

1. `frontend` — node:20-slim, `npm ci`, `vite build` → static dist
2. `backend` — `npm ci`, derive `schema.prod.prisma`, `prisma generate`, `tsc`
3. `runtime` — copies backend + frontend dist; `CMD` runs: `prisma db push --skip-generate` (idempotent schema apply) → `seed.ts` (guarded, skips when data exists) → `seed-cold-storage.ts` (guarded) → `node dist/server.js` (serves UI + API + socket on 3001)

**Startup is idempotent and order-safe:** schema push is declarative; both seeders skip when data exists; the server binds `0.0.0.0:$PORT` (Railway injects PORT).

`railway.json`: Dockerfile builder, health check `/api/health` (timeout 300s), restart ON_FAILURE ×10.

---

## 8. Installation Guide

**Prerequisites:** Node.js ≥ 20, npm ≥ 10, Git. (Optional: Docker for production-parity runs.)

```bash
# 1. Clone
git clone https://github.com/lakshaygargmaims/kisan-direct-ai.git
cd kisan-direct-ai

# 2. Backend
cd backend
npm install
cp .env.example .env            # then edit (see env table)
npx prisma generate
npm run db:push                 # creates SQLite dev.db
npm run db:seed                 # demo users/products/orders (guarded)
npx tsx prisma/seed-cold-storage.ts   # 6 cold-storage facilities (guarded)
npm run dev                     # http://localhost:3001

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5199

# 4. Verify
curl http://localhost:3001/api/health
# → {"status":"ok","service":"KisanDirect AI Backend","mode":"DEMO"}
```

**Demo logins** (password `demo123` for all): `farmer@demo.com`, `consumer@demo.com`, `admin@demo.com`, plus buyer/FPO/logistics accounts per the landing page footer.

**Run the contract suite** (backend must be running):

```bash
cd backend && node tests/contract.test.mjs   # 17 tests
```

**Production build locally:**

```bash
docker build -t kisan-direct-ai .
docker run -p 3001:3001 -e DATABASE_URL="postgresql://…" kisan-direct-ai
```

**Deploy to Railway:** `railway login` → `railway init` → `railway add --database postgres` → set variables (below) → `railway up -y -d` → `railway domain`.

**Database switching (dev):** `npm run db:sqlite | db:postgres | db:reset` via `scripts/migrate.js`.

---

## 9. Environment Variables

Never commit real values. `.env` is git-ignored; Railway variables hold production values.

| Variable | Purpose | Required | Example / placeholder |
|--------|---------|----------|----------------------|
| `DATABASE_URL` | DB connection | ✅ | `file:./prisma/dev.db` (dev) · `postgresql://USER:YOUR_SECRET_HERE@HOST:5432/DB` (prod) |
| `JWT_SECRET` | Token signing | ✅ | `YOUR_SECRET_HERE` (use a long random string) |
| `JWT_EXPIRES_IN` | Token lifetime | — | `7d` |
| `PORT` | Server port | — | `3001` |
| `NODE_ENV` | environment | — | `development` / `production` |
| `FRONTEND_URL` | CORS allow-list entry | ✅ prod | `https://your-app.up.railway.app` |
| `CORS_ORIGINS` | extra allowed origins, comma-separated | — | `https://a.vercel.app,https://b.vercel.app` |
| `PAYMENT_PROVIDER` | provider select | — | `demo` / `razorpay` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | live payments | 🔵 | `YOUR_SECRET_HERE` |
| `LOGISTICS_PROVIDER` | provider select | — | `demo` / `porter` |
| `PORTER_API_KEY` | live dispatch | 🔵 | `YOUR_SECRET_HERE` |
| `MAP_PROVIDER` / `MAP_PROVIDER_KEY` | maps | — | `demo` |
| `GEOCODING_API_KEY` / `ROUTING_API_KEY` | geo services | 🔵 | `YOUR_SECRET_HERE` |
| `STORAGE_PROVIDER` | file storage | — | `local` |
| `AI_SERVICE_URL` | external AI API | 🟡 unused | `http://localhost:8000` |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | alt. Postgres host | 🔵 | `YOUR_SECRET_HERE` |

---

## 10. Folder Structure

```text
kisan-direct-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # 65 models (SQLite dev)
│   │   ├── schema.prod.prisma       # derived PostgreSQL schema
│   │   ├── seed.ts                  # users/products/orders (guarded)
│   │   ├── seed-cold-storage.ts     # 6 facilities (guarded)
│   │   └── seed-harvests.ts         # harvest demo data (destructive-reset)
│   ├── src/
│   │   ├── config/index.ts          # env → typed config
│   │   ├── middleware/              # auth.ts · validate.ts · errorHandler.ts
│   │   ├── routes/                  # 14 routers (96 endpoints)
│   │   ├── services/                # 11 services (business logic)
│   │   ├── utils/                   # prisma.ts · socket.ts · cors.ts …
│   │   ├── types/index.ts           # UserRole, JwtPayload, AuthRequest
│   │   └── server.ts                # express + socket + static UI hosting
│   └── tests/
│       └── contract.test.mjs        # 17-test executable contract
├── frontend/
│   └── src/
│       ├── components/              # ui/ (Radix-based) · shared/ MapView …
│       ├── pages/                   # farmer/16 consumer/8 admin/7 global/6 …
│       ├── layouts/                 # DashboardLayout (role-aware nav)
│       ├── locales/                 # 23 JSON language packs
│       ├── services/api.ts          # Axios base '/api'
│       ├── stores/                  # Zustand (auth, cart)
│       ├── i18n.ts
│       └── App.tsx                  # 53 routes
├── docs/                            # this documentation set
├── scripts/                         # migrate.js · prepare-postgres.mjs
├── Dockerfile                       # 3-stage production image
├── railway.json                     # Railway config (health check)
└── README.md
```

**Where changes land:** API shape → `backend/src/routes` + matching `validators/*.schema.ts`; business rules → `backend/src/services`; DB shape → `backend/prisma/schema.prisma` (+ `npm run db:push`); screens → `frontend/src/pages/<role>/`; shared visuals → `frontend/src/components/ui` or `shared`.

---

*Continue to [03-EVALUATION-AND-ANNEXURE.md](./03-EVALUATION-AND-ANNEXURE.md) for testing, quality audit, roadmap, viva preparation, and references.*
