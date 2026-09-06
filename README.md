# KisanDirect AI

**From Farm to Buyer. Direct. Fair. Smart.**

> SIH Problem Statement PS26033 — Eliminating middlemen between farmers and consumers with AI-powered marketplace, smart logistics, and transparent payments.

---

## Problem Statement

Multiple intermediaries between farmers and consumers reduce farmer earnings by 30-40% and increase consumer prices by 50-80%. Farmers lack direct market access, fair pricing, and efficient logistics.

## Solution

KisanDirect AI is a full-stack platform that directly connects farmers/FPOs with consumers and B2B buyers. It features AI-powered pricing, smart geo-logistics, order clubbing, and secure escrow-style payments.

**Core Innovation:**
```
Farmer → Direct Marketplace → Consumer / B2B Buyer → Smart Geo-Logistics → AI Order Clubbing → Lower Costs → Higher Farmer Earnings → Fairer Consumer Prices
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, MapLibre GL JS |
| Backend | Node.js, Express.js, TypeScript, JWT Auth, Prisma ORM |
| Database | PostgreSQL (production) / SQLite (zero-setup local dev) |
| Maps | MapLibre GL JS (OpenStreetMap compatible) |
| State | Zustand, TanStack Query |

> **Single-service architecture:** the Express backend serves the built React app, the REST API and WebSockets from **one process and one URL** — no CORS, no cross-origin sockets, no separate frontend host. Local development still uses the Vite dev server on :5173 proxying to the API on :3001.

## Features

### 🌾 Marketplace
- Product search with filters (category, price, distance, organic, rating)
- Real-time availability and AI-recommended pricing
- Direct farmer-to-buyer communication

### 🗺️ Smart Geo-Logistics
- Interactive maps with 4 modes (Consumer, Farmer, Logistics, Admin)
- Product-specific delivery radius and rules
- Cold-chain management and transit time optimization

### 📦 AI Order Clubbing
- Detects geographically compatible orders
- Groups orders for multi-stop delivery
- Transparent cost comparison (separate vs. clubbed)
- Typical savings: 30-40% on logistics

### 💰 Transparent Payments
- 20% advance payment in escrow
- Configurable cancellation policy
- Farmer settlement with platform fee breakdown
- Price transparency: shows exactly where money goes

### 🤖 AI Features
- Fair price engine (product, season, demand, supply analysis)
- Demand forecasting
- Farmer recommendation ranking (distance, price, quality, rating)
- Quality assessment (demo)
- Risk/fraud detection

### 👥 Role-Based Access
- **Consumer**: Browse, buy, track orders, find farmers
- **Farmer/FPO**: Manage products, accept orders, view analytics, AI price advisor
- **B2B Buyer**: Post requirements, bulk procurement
- **Logistics**: Delivery management, route optimization
- **Admin**: Full platform management, analytics, disputes, rules configuration

---

## Quick Start

### Prerequisites
- Node.js 18+

### 1. Clone & Install

```bash
git clone <repo-url>
cd kisan-direct-ai

# Install all dependencies
npm run setup
```

### 2. Run in Development (SQLite, zero setup)

```bash
# Runs backend (:3001) + Vite frontend (:5173, proxies /api and /socket.io)
npm run dev
```

Open **http://localhost:5173**. The first boot auto-creates the SQLite database and seeds demo accounts/products.

### 3. Run in Production Mode (single service)

```bash
npm run build        # builds frontend + backend
npm start            # one Express server serves UI + API + WebSockets on :3001
```

Open **http://localhost:3001** — the whole app runs from one URL.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Consumer | consumer@demo.com | demo123 |
| Farmer | farmer@demo.com | demo123 |
| FPO | fpo@demo.com | demo123 |
| B2B Buyer | buyer@demo.com | demo123 |
| Logistics | logistics@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

---

## Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| JWT_SECRET | JWT signing secret | dev-secret |
| MAP_PROVIDER | Map provider (demo/google/mapbox) | demo |
| PAYMENT_PROVIDER | Payment provider (demo/razorpay) | demo |
| LOGISTICS_PROVIDER | Logistics provider (demo/porter) | demo |

All providers default to **DEMO mode** — no paid API keys needed.

---

## API Documentation

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Products
- `GET /api/products` — List products (with search, filters, pagination)
- `GET /api/products/:id` — Product details
- `POST /api/products` — Create product (Farmer/FPO)
- `PUT /api/products/:id` — Update product
- `DELETE /api/products/:id` — Deactivate product

### Orders
- `POST /api/orders` — Create order
- `GET /api/orders` — List orders
- `GET /api/orders/:id` — Order details with tracking
- `POST /api/orders/:id/cancel` — Cancel order

### Logistics
- `GET /api/logistics/clubbing` — Get clubbing opportunities
- `POST /api/logistics/quote` — Delivery cost estimate
- `POST /api/logistics/create` — Create delivery

### Payments
- `POST /api/payments/create` — Process payment
- `POST /api/payments/:orderId/refund` — Process refund
- `GET /api/payments/settlements` — Farmer settlements

### Map
- `GET /api/map/farmers` — Nearby farmers
- `GET /api/map/buyers` — Nearby buyers
- `GET /api/map/hubs` — Collection hubs
- `GET /api/map/demand` — Demand data

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/analytics` — Analytics data
- `GET /api/admin/users` — User management
- `GET /api/admin/disputes` — Dispute management
- `PUT /api/admin/cancellation-policy` — Update policy

### AI Service (FastAPI at :8000)
- `POST /ai/fair-price/predict` — Fair price prediction
- `POST /ai/demand-forecast/predict` — Demand forecasting
- `POST /ai/farmer-recommendation/rank` — Farmer ranking
- `POST /ai/quality-assessment/assess` — Quality grading
- `POST /ai/risk-score/calculate` — Risk scoring
- `POST /ai/route-optimize/optimize` — Route optimization

---

## Architecture

```
kisan-direct-ai/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── layouts/          # Public + Dashboard layouts
│   │   ├── services/         # API client layer
│   │   ├── store/            # Zustand state management
│   │   └── ...
├── backend/                  # Express.js + TypeScript (serves UI + API in prod)
│   ├── src/
│   │   ├── config/           # Environment config
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, error handling
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # CORS, Prisma singleton, Socket.IO
│   │   └── server.ts         # Entry point (also serves the built frontend)
│   ├── prisma/
│   │   ├── schema.prisma     # Single source-of-truth schema (SQLite dev)
│   │   ├── schema.prod.prisma# Derived PostgreSQL schema (created at Docker build)
│   │   └── seed.ts           # Demo data (guarded: only seeds an empty DB)
│   └── scripts/prepare-postgres.mjs  # Derives the Postgres schema + client
├── Dockerfile                # Single-service production image (Railway)
├── railway.json              # Railway config (Docker builder + healthcheck)
├── .env.example              # Environment template
└── README.md
```

---

## Database Schema

50+ models including: User, FarmerProfile, FPOProfile, ConsumerProfile, BuyerProfile, Product, ProductCategory, ProductDeliveryRule, Order, OrderItem, OrderStatusHistory, OrderClub, Delivery, Payment, CancellationPolicy, Dispute, Review, Notification, PriceHistory, DemandForecast, RiskScore, CollectionHub, Crate, AuditLog, and more.

---

## Demo Scenario

The application supports this complete workflow:

1. Consumer searches "Tomato" → sees nearby farmers with AI ranking
2. Selects Rajesh Farm → 500kg Tomato at ₹28/kg
3. System checks delivery radius → ELIGIBLE
4. Consumer pays 20% advance (₹2,800)
5. Farmer receives order on dashboard
6. System detects 3 clubbing-compatible orders
7. Farmer accepts club → saves ₹190 on logistics
8. Map shows optimized multi-stop route
9. Demo logistics assigns vehicle
10. Delivery tracked in real-time
11. Consumer confirms delivery → farmer settlement
12. Consumer rates farmer

---

## Deployment (Railway — one service)

The whole app — UI, API and real-time updates — deploys as **one service** from the repo root. The included `Dockerfile` builds the React app and the backend, derives the PostgreSQL Prisma schema automatically, and starts a single server.

### 1. Push to GitHub

```bash
git add -A && git commit -m "feat: single-service deployment"
git push
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo. Railway auto-detects the root `railway.json` + `Dockerfile`.
3. Add a **PostgreSQL** database: **+ New** → **Database** → **PostgreSQL**
4. Attach it to the service (or copy its **Internal Connection URL**):
   - `DATABASE_URL` = the PostgreSQL internal URL
   - `JWT_SECRET` = a long random string
   - `NODE_ENV` = `production`
5. Railway builds and boots. On first boot it creates the schema and seeds demo data **only if the database is empty**.
6. Open your service's **Settings → Networking** public URL — the app is served at `/`.

No other variables are required: the frontend talks to `/api` and `/socket.io` on its own origin.

### Deploy with plain Docker

```bash
docker build -t kisan-direct-ai .
docker run -p 3001:3001 -e DATABASE_URL=postgresql://user:pass@host:5432/db -e JWT_SECRET=secret kisan-direct-ai
```

### Demo Accounts (password: demo123)

| Role | Email |
|------|-------|
| Consumer | consumer@demo.com |
| Farmer | farmer@demo.com |
| B2B Buyer | buyer@demo.com |
| FPO | fpo@demo.com |
| Admin | admin@demo.com |
| Logistics | logistics@demo.com |

---

## Future Improvements

- [x] Multi-language support (22 Indian languages)
- [x] WebSocket real-time updates
- [x] MapLibre GL JS maps with real tiles
- [x] AI Demand Heatmap
- [x] Global Bulk Export module
- [ ] Razorpay/UPI payment gateway
- [ ] Porter/Dunzo logistics API
- [ ] Mobile app (React Native)

---

## License

Built for Smart India Hackathon (SIH) 2024 — Problem Statement PS26033.
