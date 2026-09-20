# KisanDirect AI — Complete Project Documentation

**From Farm to Buyer. Direct. Fair. Smart.**

> Built for Smart India Hackathon 2026 — Problem Statement **PS26033**: eliminating middlemen between farmers and consumers with an AI-assisted marketplace, smart logistics, transparent payments, smart cold storage, and global trade enablement.

| Document Control | |
|---|---|
| Version | 2.0 — generated from a full codebase audit (September 2026) |
| Status | 🟢 Implemented and production-deployed |
| Production URL | https://kisan-direct-ai-production-4899.up.railway.app |
| Repository | https://github.com/lakshaygargmaims/kisan-direct-ai |
| Deployment | Railway — Docker single service + PostgreSQL 18 |

| Submission placeholders | |
|---|---|
| Team Name | ______________________ |
| Team Members | ______________________ |
| College | ______________________ |
| Course / Department | ______________________ |
| Academic Year | ______________________ |
| Guide / Mentor | ______________________ |

**Status legend used throughout this documentation:**

- 🟢 **IMPLEMENTED** — exists in code and was verified working end-to-end
- 🟡 **PARTIALLY IMPLEMENTED** — exists but with known gaps (called out explicitly)
- 🔵 **PLANNED / FUTURE** — not in the codebase; roadmap only

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Executive Summary](#1-executive-summary) |
| 2 | [Introduction](#2-introduction) |
| 3 | [Problem Statement](#3-problem-statement) |
| 4 | [Proposed Solution](#4-proposed-solution) |
| 5 | [Objectives](#5-objectives) |
| 6 | [Scope](#6-scope) |
| 7 | [Target Users & Roles](#7-target-users--roles) |
| 8 | [Functional Requirements](#8-functional-requirements) |
| 9 | [Non-Functional Requirements](#9-non-functional-requirements) |
| 10 | [Technology Stack](#10-technology-stack) |
| 11 | [System Architecture](#11-system-architecture) |
| 12 | [Database Architecture & ER Model](#12-database-architecture--er-model) |
| 13 | [Data Flow Diagrams](#13-data-flow-diagrams) |
| 14 | [UML Diagrams](#14-uml-diagrams) |
| 15 | [User Flows](#15-user-flows) |
| 16 | [Project Metrics](#16-project-metrics) |

Companion documents in `docs/`:

- **[02-TECHNICAL-REFERENCE.md](./02-TECHNICAL-REFERENCE.md)** — API reference, database reference, authentication & authorization, security, AI architecture, external integrations, deployment & Docker, installation guide, environment variables, folder structure.
- **[03-EVALUATION-AND-ANNEXURE.md](./03-EVALUATION-AND-ANNEXURE.md)** — testing, performance & scalability, error handling, code-quality audit, risks & mitigation, limitations, future enhancements, development roadmap, viva questions with answers, SIH/judge Q&A, glossary, references.

---

## 1. Executive Summary

KisanDirect AI is a full-stack agricultural marketplace that connects farmers and FPOs (Farmer Producer Organizations) directly with consumers and B2B buyers. Farmers list produce; buyers order directly; the platform computes fair prices and demand forecasts from its **own real transaction data**; compatible orders are clubbed to cut logistics cost; harvested crops can be placed into nearby cold storage and sold later with AI-assisted timing insights; harvests can be pre-booked before they exist; and export-readiness workflows serve international buyers.

**Everything summarized below was verified by live end-to-end testing** — a 17-test contract suite against the local backend and a 19-check smoke suite against the production deployment over the public internet (see [Testing](./03-EVALUATION-AND-ANNEXURE.md#1-testing)):

- Authentication with JWT and role-based access for **6 roles** (Consumer, Farmer, FPO, B2B Buyer, Logistics, Admin)
- Product management and marketplace search with 23-language UI
- Ordering with **20% advance payment**, atomic inventory (no oversell under concurrent orders — verified with deliberate races), policy-driven cancellation with refunds and stock restoration
- Demo-mode payment and logistics providers with all amounts and authorization computed **server-side**
- **Smart Cold Storage**: 6 seeded facilities, quotes with exact cost math, bookings with paid status and batch codes, stored-batch inventory, list-from-storage into the marketplace, withdrawal, and AI selling insights with mandatory "not a guaranteed price" disclaimers
- **QR traceability** pages that expose batch and facility data but no farmer PII (verified)
- Real-time order events to farmer and buyer via Socket.IO

**Core innovation chain:**

```
Farmer → Direct Marketplace → Consumer / B2B Buyer → Smart Geo-Logistics
      → AI Order Clubbing → Lower Costs → Higher Farmer Earnings
      → Fairer Consumer Prices — plus "Store now, sell later" cold storage
```

---

## 2. Introduction

KisanDirect AI is deployed as a **single Node.js process** that serves the REST API, the React UI, and the Socket.IO websocket together (production). One Docker image, one port (3001), one domain. In development the frontend (Vite, port 5199) and backend (port 3001) run separately.

The codebase is organized as two applications in one repository:

```
kisan-direct-ai/
├── frontend/   React 18 + TypeScript + Vite SPA
├── backend/    Express + TypeScript + Prisma REST API
├── docs/       This documentation set
├── scripts/    Helper scripts (DB switching)
├── Dockerfile  Production single-service image
└── railway.json Railway deployment configuration
```

A defining property of the implementation: **AI features are statistical models computed from the platform's own order and listing data** (section 18 of the technical reference), not calls to external LLM APIs, and no custom model training is claimed. When platform data is sparse, endpoints fall back to clearly-labeled demo references.

---

## 3. Problem Statement

Farmers selling produce in traditional mandi chains face a structural problem: multiple intermediate trade layers sit between the farm and the consumer. Each layer takes a margin, so the farmer receives a small fraction of the final consumer price while consumers pay inflated rates. Three concrete sub-problems drive the design of this project:

1. **No direct market access.** A farmer's reachable buyers are limited to whoever visits the local mandi. Demand discovery beyond that radius effectively does not exist for a smallholder.
2. **Price opacity and distress selling.** Without visibility into real transaction prices, farmers cannot judge whether an offer is fair — perishable produce forces sales even at bad prices. This is precisely the pain KisanDirect's fair-price estimation and cold-storage "store now, sell later" features target.
3. **Logistics and post-harvest loss.** Small, uncoordinated shipments are expensive; without storage options, unsold perishables are wasted.

The platform addresses these with direct listing and ordering, price transparency computed from real platform transactions, order clubbing for shared logistics, and registered cold-storage capacity with AI-assisted sell-timing.

---

## 4. Proposed Solution

**Problem → Solution → Technology → Outcome:**

| Problem | Solution (implemented) | Technology | Outcome |
|---|---|---|---|
| Middlemen capture margin | Direct listing → ordering → payment between farmer and buyer | React SPA + Express REST API + Prisma/PostgreSQL | More of each rupee stays with the farmer |
| Price opacity | Fair-price estimates computed from the platform's own 90-day order history and live listings | Statistical model in `ai.routes.ts` over real `Order`/`Product` data | Defensible price guidance, always labeled "not a guaranteed price" |
| Poor demand discovery | Marketplace with search/filters, demand heatmap, buyer requirements with offers, harvest pre-booking | PostgreSQL queries + MapLibre maps | Buyers find farmers; farmers see demand before harvest |
| Costly small shipments | Order clubbing by route proximity | `OrderClub`/`OrderClubMember` models + matching logic | Shared logistics, lower per-kg delivery cost |
| Distress selling of perishables | Smart Cold Storage: find facility → quote → book → store → sell later | `ColdStorageFacility`, `StorageBooking`, `StoredBatch`, `StoragePayment` + AI selling insight | Farmers choose *when* to sell |
| Pre-harvest market linkage | Expected-harvest listings with reservations and buyer matching | `ExpectedHarvest*` models + `harvest.routes.ts` | Sales booked before harvest exists |
| Export complexity | Global-trade module: RFQs, supplier matching, export readiness, shipments, documents | `Export*`/`Global*` models + `global-trade.routes.ts` | Structured path from farm to international buyer |

---

## 5. Objectives

🟢 **Implemented objectives:**

1. Direct farmer-to-buyer marketplace with no intermediate trade layer
2. Role-based platform for 6 user types with JWT security
3. Transparent, data-driven price and demand estimation
4. Digital ordering with advance payment, refunds, and cancellation policy
5. Atomic inventory that cannot oversell, even under concurrent orders
6. Smart cold storage with booking, batch tracking, QR traceability, and AI sell-timing insight
7. Harvest pre-booking with reservations and buyer matching
8. Global trade (export) workflow for international buyers
9. Real-time order lifecycle updates via websockets
10. Accessible multilingual UI (23 Indian languages, including tribal languages)
11. Single-service, low-cost deployment (Railway + PostgreSQL)

🔵 **Planned objectives** (see Future Enhancements): live mandi price integration, real payment gateway, live logistics partner, mobile app.

---

## 6. Scope

**In scope (implemented):** web platform for farmer/FPO/consumer/B2B-buyer/logistics/admin roles; product, order, payment, delivery, cold-storage, harvest, demand, and export modules; demo providers for external services; single-service Docker deployment.

**Out of scope (current version):** native mobile apps; real-money payment processing; live third-party logistics dispatch; IoT cold-storage monitoring; government API integrations (mandi prices ship as a static reference dataset — see section 19 of the technical reference). All are described under Future Enhancements with honest status labels.

---

## 7. Target Users & Roles

All six roles are enforced in code (`backend/src/types/index.ts` → `UserRole`) and by the `authorize(...roles)` middleware:

| Role | 🟢/🔵 | What they do in the platform |
|---|---|---|
| **FARMER** | 🟢 | Manage profile & farm details, list products, manage orders, book cold storage, track stored batches, list stored produce, pre-book harvests |
| **FPO** | 🟢 | Farmer-organization variant of farmer capabilities (aggregate member produce, list products, receive orders) |
| **CONSUMER** | 🟢 | Browse/search marketplace, order produce, pay 20% advance, track orders live, cancel per policy, review, cold-storage traceability |
| **B2B_BUYER** | 🟢 | Bulk procurement, buyer requirements + offers, export RFQs, global trade workflows |
| **LOGISTICS** | 🟢 | Logistics partner dashboard: view assigned shipments, update delivery status |
| **ADMIN** | 🟢 | Platform oversight: users, products, orders, disputes, verification, cancellations |

---

## 8. Functional Requirements

Generated from the actual routes, services, and pages. Status reflects what the code implements and what was verified.

| ID | Requirement | Description | User | Status |
|----|-------------|-------------|------|--------|
| FR-01 | Registration | Register with email, password (bcrypt-hashed), name, role, phone; duplicate email rejected | All | 🟢 |
| FR-02 | Login / Logout | JWT issued on login; invalid credentials → 401; token stored client-side; logout clears session | All | 🟢 |
| FR-03 | Role-based access | Protected routes verify JWT; role-specific endpoints reject wrong roles with 403 | All | 🟢 |
| FR-04 | Product management | Farmers/FPOs create, update, delete products with images, category, grade, price, quantity, location | Farmer/FPO | 🟢 |
| FR-05 | Marketplace search | Product listing with search, category/price filters, pagination | Buyer side | 🟢 |
| FR-06 | Cart | Add to cart, cart items, cart-based ordering | Consumer/Buyer | 🟢 |
| FR-07 | Order creation | Direct order with quantity; total = qty × price; **20% advance** computed server-side | Consumer/Buyer | 🟢 |
| FR-08 | Payments (demo) | Advance payment, remaining payment, refunds; amounts validated server-side; wrong buyer or double payment rejected | Consumer/Buyer | 🟢 (demo provider) |
| FR-09 | Order lifecycle | Status transitions PENDING_ADVANCE → ADVANCE_PAID → FARMER_ACCEPTED → PREPARING → LOGISTICS_ASSIGNED → SHIPPED/DELIVERED with full status history | Farmer/Consumer | 🟢 |
| FR-10 | Order cancellation | Buyer/admin cancel with policy-based refund % (100% at PENDING_ADVANCE down to 25% after LOGISTICS_ASSIGNED); stock restored exactly once | Consumer/Admin | 🟢 |
| FR-11 | Atomic inventory | Quantity deduction inside DB transactions; concurrent orders race-tested — oversell impossible | System | 🟢 |
| FR-12 | Delivery (demo) | Delivery quote by distance, shipment creation, status tracking, assignment | All | 🟢 (demo provider) |
| FR-13 | Real-time updates | Socket.IO events: order created / status changed / cancelled to farmer & buyer rooms | Farmer/Consumer | 🟢 |
| FR-14 | Cold storage discovery | Facility list filtered by crop, radius, location; map view; detail cards with capacity/price/temperature | Farmer | 🟢 |
| FR-15 | Storage quotes | Cost = qty × rate × days computed server-side; min-qty/capacity/duration boundaries enforced with 400s | Farmer | 🟢 |
| FR-16 | Storage booking | Book capacity → paid booking → `StoredBatch` with code `KDA-XXX-YYYY-NNNNNN` and QR token | Farmer | 🟢 |
| FR-17 | Stored inventory | Batches with current/listed/sold quantities, days stored/remaining, accumulated cost | Farmer | 🟢 |
| FR-18 | Sell from storage | List batch quantity as marketplace product; batch ⇄ product sync on every sale (verified: 500→260→SOLD_OUT) | Farmer | 🟢 |
| FR-19 | Withdraw from storage | Withdraw unlisted quantity; capacity credited exactly once; blocked while listings active | Farmer | 🟢 |
| FR-20 | AI fair price | Estimate from 90-day real orders + live listings + seasonal factor; range + disclaimer | Farmer/Buyer | 🟢 |
| FR-21 | AI demand forecast | Day-of-week demand patterns from 60-day order history → N-day forecast | Farmer | 🟢 |
| FR-22 | AI selling insight | Cold-storage batches: sell-now vs sell-later estimate with cost deduction and mandatory disclaimer | Farmer | 🟢 |
| FR-23 | QR traceability | Public trace page by batch QR token: product, batch, harvest date, facility, grade — **no farmer PII** | Public | 🟢 |
| FR-24 | Harvest pre-booking | Expected-harvest listings, images, reservations, allocations, delays, buyer matching, harvest payments | Farmer/Buyer | 🟢 |
| FR-25 | Demand analytics | Demand zones, product demand, snapshots; heatmap UI | All | 🟢 |
| FR-26 | Buyer requirements | Buyers post requirements; farmers/FPOs send offers | Buyer/Farmer | 🟢 |
| FR-27 | Order clubbing | Orders grouped into clubs by route for shared logistics | System/Admin | 🟢 |
| FR-28 | Global trade | Global buyer profiles, product listings, export eligibility/readiness, RFQs + items, supplier matches, supply aggregation, offers, shipping estimates, shipments + status, document requirements + documents | B2B/Admin | 🟢 |
| FR-29 | Mandi price reference | APMC price comparison dataset (static, data.gov.in-derived) with platform-vs-mandi comparison endpoint | All | 🟡 (static data, not live API) |
| FR-30 | Notifications | In-app notification records + UI | All | 🟢 |
| FR-31 | Reviews & disputes | Post-delivery reviews; dispute records for admin moderation | Consumer/Admin | 🟢 |
| FR-32 | Admin oversight | User/product/order management, verification, audit log | Admin | 🟢 |
| FR-33 | Multilingual UI | 23 language packs incl. Santali, Bodo, Kokborok, Manipuri, Dogri, Maithili, Konkani, Kashmiri, Sanskrit, Sindhi | All | 🟢 |
| FR-34 | Live mandi prices from data.gov.in API | Real-time APMC price fetch | All | 🔵 |
| FR-35 | Real payment gateway (Razorpay) | Razorpay keys are plumbed through config but the provider used is demo | Consumer | 🔵 (config-ready) |
| FR-36 | Live logistics partner (Porter) | Porter API key config-ready; dispatch is demo | Farmer | 🔵 (config-ready) |

---

## 9. Non-Functional Requirements

| Attribute | How the current implementation addresses it |
|---|---|
| **Security** | bcrypt password hashing; JWT auth; role authorization middleware; Zod validation on every route; parameterized Prisma queries (no raw SQL); custom CORS allow-list; server-side money math (client-sent amounts never trusted); PII-safe public traceability |
| **Reliability** | Atomic DB transactions for orders, cancellations, batch operations; race conditions explicitly tested (3 test cases); idempotent-guarded double-cancel and double-payment; guarded post-commit batch sync that logs instead of failing orders |
| **Performance** | Indexed lookups via Prisma schema; aggregation queries for AI features scoped to 60–90-day windows; single-process deployment avoids cross-service latency; production smoke test observed sub-second API responses over the public internet |
| **Scalability** | Stateless API (JWT) → horizontal scaling ready; PostgreSQL on Railway with volume; single Docker image scales as one unit; see Scalability in the annexure for the growth path |
| **Usability** | 23-language UI, demo-login buttons for every role, breadcrumbs, command palette, loading/empty/error states, responsive Tailwind layout |
| **Maintainability** | Strict TypeScript on both sides; layered backend (routes → validators → services → Prisma); one contract-test suite that documents the cold-storage/order invariants executably |
| **Portability** | Dev on SQLite, prod on PostgreSQL via derived prod schema + `scripts/migrate.js`; single Dockerfile runs on any host |
| **Availability** | Railway health check on `/api/health`, restart-on-failure policy (max 10 retries) |
| **Accessibility** | Radix UI primitives (keyboard/screen-reader behavior), semantic HTML, reduced-motion-friendly transitions |

---

## 10. Technology Stack

Every row verified against `package.json` files:

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 18.2 | UI library |
| | TypeScript | 5.x | Type safety |
| | Vite | 5.x | Dev server + build |
| | Tailwind CSS + tailwindcss-animate | 3.x | Styling system |
| | Radix UI (dialog, dropdown, select, tabs, label, slot) | 1.x/2.x | Accessible primitives |
| | React Router | 6.21 | Client routing (53 route paths) |
| | TanStack React Query | 5.17 | Server-state management/caching |
| | Zustand | 4.4 | Client state (cart, auth session) |
| | Axios | 1.6 | HTTP client (relative `/api` base) |
| | MapLibre GL | 3.6 | Interactive maps (farmers, demand, cold storage, trade) |
| | Recharts | 2.10 | Dashboard charts |
| | i18next + react-i18next | 26/17 | Internationalization, 23 locales |
| | socket.io-client | 4.8 | Real-time order events |
| | lucide-react, sonner, clsx, cva, tailwind-merge | — | Icons, toasts, styling utilities |
| Backend | Node.js + Express | 4.18 | REST API server |
| | TypeScript | 5.x | Type safety |
| | Zod | 3.22 | Request validation (10 schema files) |
| | jsonwebtoken | 9.0 | JWT auth |
| | bcryptjs | 2.4 | Password hashing |
| | cors + custom allow-list | 2.8 | Origin control |
| | socket.io | 4.8 | Websockets |
| | express-rate-limit | 7.1 | Installed; 🟡 **not currently wired** into the app (see Code Quality) |
| | dotenv | 16.4 | Env configuration |
| Database | SQLite | — | Development database |
| | PostgreSQL | 18 | Production database (Railway) |
| ORM | Prisma | 5.10 | Schema, typed client, migrations-by-push |
| AI | Custom statistical models | — | Computed in `ai.routes.ts` from real platform data (no external AI API; 🟡 `AI_SERVICE_URL` config exists but is unused) |
| Deployment | Docker (3-stage) | — | Single production image |
| | Railway | — | Hosting: app service + PostgreSQL 18 |
| Version Control | Git + GitHub | — | `github.com/lakshaygargmaims/kisan-direct-ai` |

---

## 11. System Architecture

### Figure 11.1 — High-Level System Architecture

```text
                        ┌──────────────────────────────────────────────┐
                        │                  USERS                       │
                        │  Farmer/FPO  Consumer  B2B  Logistics  Admin │
                        └──────────────────────┬───────────────────────┘
                                               │ HTTPS
                                               ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │            SINGLE SERVICE (Docker on Railway, port 3001)         │
        │                                                                  │
        │  ┌────────────────────────┐    ┌──────────────────────────────┐  │
        │  │ React SPA (built dist) │    │  Express REST API  /api/*    │  │
        │  │ React Router · Query · │───▶│  14 route modules · 96       │  │
        │  │ Zustand · MapLibre ·   │    │  endpoints                   │  │
        │  │ i18next (23 locales)   │    │                              │  │
        │  └────────────────────────┘    │  middleware chain:           │  │
        │                                │   CORS allow-list → JSON →   │  │
        │  ┌────────────────────────┐    │   rate-limit(dep) → route →  │  │
        │  │ Socket.IO  /socket.io  │    │   Zod validate → JWT auth →  │  │
        │  │ order:created ·        │◀───┤   role authorize → controller│  │
        │  │ order:status-changed · │    │   → service → Prisma         │  │
        │  │ order:cancelled        │    └──────────────┬───────────────┘  │
        │  └────────────────────────┘                   │                  │
        │                                ┌──────────────▼───────────────┐  │
        │                                │  Service layer (11 services) │  │
        │                                │  auth·product·order·payment· │  │
        │                                │  logistics·cold-storage·     │  │
        │                                │  harvest·demand·global-trade·│  │
        │                                │  admin·notification          │  │
        │                                └──────────────┬───────────────┘  │
        └───────────────────────────────────────────────┼──────────────────┘
                                                        │ Prisma ORM
                                                        ▼
                                           ┌────────────────────────┐
                                           │  PostgreSQL 18 (Railway)│
                                           │  65 models · volume     │
                                           └────────────────────────┘

        External providers (all 🟢 demo-mode, config-ready for live keys):
          PAYMENT_PROVIDER=demo   LOGISTICS_PROVIDER=demo   MAP_PROVIDER=demo
```

**Why single-service:** one Docker image serving UI + API + websockets removes cross-origin complexity (the SPA calls relative `/api`), halves hosting cost, and gives one health check — appropriate for a hackathon-scale product that can still scale horizontally as one unit.

### Figure 11.2 — Frontend Architecture

```text
main.tsx
  └─ App.tsx (53 routes, role-guarded wrappers)
       └─ layouts/DashboardLayout.tsx (role-aware sidebar/topbar)
            └─ pages/ (46 pages: farmer 16 · consumer 8 · admin 7 ·
                       global 6 · buyer 3 · logistics 3 · public 3)
                 └─ components/ (ui/, shared/ MapView, layout/,
                                 marketplace/, farmer/, consumer/, …)
                      └─ services/api.ts  (Axios, baseURL = '/api')
                           ├─ TanStack Query (server state, caching, retries)
                           ├─ Zustand stores   (auth session, cart)
                           ├─ i18next          (23 locale packs)
                           └─ socket.io-client (live order events)
```

### Figure 11.3 — Backend Architecture (layered)

```text
server.ts ── mounts 14 routers under /api/*
   │
   ▼
routes/*.routes.ts        HTTP surface (96 endpoints)
   │  validate(zodSchema) ── 400 on bad input before any logic
   ▼
middleware/auth.ts        authenticate (JWT) → authorize(role…)
   ▼
controllers (inline in routes) ── thin adapters
   ▼
services/*.service.ts     business rules + transactions
   │                       (auth, product, order, payment, logistics,
   │                        cold-storage, harvest, demand, global-trade,
   │                        admin, notification)
   ▼
utils/prisma.ts           typed DB access (65 models)
utils/socket.ts           room-scoped realtime emitters
   ▼
errorHandler.ts           AuthError→status · ZodError→400 ·
                          Prisma P2025→404 · fallback→500 (no stack leak)
```

---

## 12. Database Architecture & ER Model

Two Prisma schemas from one source of truth: `schema.prisma` (SQLite, dev) and `schema.prod.prisma` (PostgreSQL, generated by `scripts/prepare-postgres.mjs` at Docker build). **65 models**, string-based enums (Prisma enum support differs across the two datasources, so roles/statuses are validated in application code and Zod).

### Figure 12.1 — Core Domain ER Diagram (primary relationships)

```text
┌──────────────┐ 1     1 ┌──────────────────┐
│    User      │─────────│ FarmerProfile    │
│ id (PK)      │         │ farmName, soil,  │
│ email (uniq) │1     0..1│ area, lat/lng … │
│ passwordHash │─────────│ FPOProfile /     │
│ role         │         │ ConsumerProfile /│
│ isVerified   │         │ BuyerProfile /   │
└──────┬───────┘         │ LogisticsPartner │
       │ 1               └──────────────────┘
       │
       │ owns                        ┌───────────────┐ 1      * ┌──────────────┐
       ▼                        1..* │ ProductImage  │──────────│   Product    │
┌──────────────┐ 1        * ┌───────│───────────────┘          │ id (PK)      │
│ ProductCateg.│────────────│Product│◀── Favorite, Review,     │ name, price, │
└──────────────┘            └───┬───┘    PriceHistory,          │ qty, grade,  │
                                │        QualityAssessment      │ lat/lng,     │
       ┌────────────────────────┤                               │ isActive     │
       │                        │                               └──────┬───────┘
       ▼                        ▼                                      │ 1
┌──────────────┐        ┌──────────────┐   *     1 ┌──────────────┐     │
│  Cart        │1 ─────▶│  CartItem    │──────────▶│   Product    │     │
└──────────────┘ *      └──────────────┘           └──────────────┘     │
                                                                        ▼
┌──────────────┐ 1      * ┌──────────────────────┐          ┌──────────────────┐
│  User        │──────────│       Order          │  *    1  │      User        │
│ (buyerId)    │          │ id, quantity,        │──────────│   (farmerId)     │
└──────────────┘          │ pricePerKg, total,   │          └──────────────────┘
                          │ advanceAmount(20%),  │
                          │ remainingAmount,     │   *  1 ┌─────────────────────┐
                          │ status, address,     │───────▶│      Product        │
                          │ deliveryLat/Lng      │        └─────────────────────┘
                          └───┬──────────┬───────┘
                              │1         │1
              ┌───────────────▼──┐    ┌──▼─────────────────┐
              │ OrderStatusHistory│   │ Payment            │
              │ every transition │   │ advance/remaining/ │
              └──────────────────┘   │ refund, providerRef│
                                     └────────────────────┘
        Order 1 ─── 0..1 Delivery (provider DEMO, tracking, vehicle)
        OrderClub 1 ─── * OrderClubMember ─── 1 Order   (logistics clubbing)

┌───────────────────────┐ 1    * ┌────────────────────┐ 1    * ┌──────────────┐
│  ColdStorageFacility  │───────▶│   StorageBooking   │───────▶│ StoredBatch  │
│ capacity, avail,      │        │ qty, days, payment │        │ batchCode    │
│ temp range, crops,    │        │ status             │        │ KDA-XXX-…    │
│ rate, verified        │        └────────────────────┘        │ current/listed│
└───────────────────────┘                                      │ /soldQtyKg   │
        StoredBatch 1 ─── 0..1 Product (listed produce)        │ status, QR   │
        StoredBatch 1 ─── * StoragePayment                     └──────────────┘

┌──────────────────┐ 1  * ┌─────────────────────┐      ┌──────────────────────┐
│ ExpectedHarvest  │─────▶│ HarvestReservation  │      │ BuyerRequirement 1 ─▶│
│ crop, qty, date, │      │ HarvestAllocation   │      │ Offer *              │
│ lat/lng, status  │      │ HarvestBuyerMatch   │      └──────────────────────┘
└──────────────────┘      │ HarvestPayment      │
                          └─────────────────────┘      Export family:
┌───────────────┐  1  *  ┌─────────────┐               GlobalBuyerProfile ·
│ DemandZone    │───────▶│ProductDemand│               GlobalProductListing ·
│ (geo demand)  │        │ DemandSnap. │               ExportEligibility · ExportRFQ(+Item) ·
└───────────────┘        └─────────────┘               ExportSupplierMatch · SupplyAggregation ·
                                                        ExportOffer · ExportShipment(+Status) ·
Supporting: Notification · Dispute · CancellationPolicy · ExportDocument(+Requirement) ·
AuditLog · Verification · RiskScore · CollectionHub · Crate · MarketPrice ·           ShippingEstimate
```

The complete model list (all 65) with per-table field documentation is in the [Database Reference](./02-TECHNICAL-REFERENCE.md#2-database-reference).

---

## 13. Data Flow Diagrams

### Figure 13.1 — DFD Level 0 (context diagram)

```text
 ┌─────────┐     listings, orders, storage     ┌─────────────────────┐
 │ FARMER / │──────────────────────────────────▶│                     │
 │  FPO    │◀──────────────────────────────────│                     │
 └─────────┘   orders, payments, AI insight    │                     │
                                              │   KisanDirect AI    │
 ┌─────────┐   search, orders, tracking        │      (0)            │
 │ CONSUMER/│──────────────────────────────────▶│                     │
 │ B2B BUYER│◀──────────────────────────────────│                     │
 └─────────┘   order status, live events       │                     │
                                              │                     │
 ┌─────────┐   oversight, moderation             │                     │
 │  ADMIN  │◀──────────────────────────────────▶│                     │
 └─────────┘                                    └──────────┬──────────┘
 ┌─────────┐   shipment status                             │
 │LOGISTICS│◀─────────────────────────────────────────────┤
 └─────────┘                                               ▼
                                                ┌──────────────────┐
                                                │  PostgreSQL DB   │
                                                └──────────────────┘
```

### Figure 13.2 — DFD Level 1 (major processes)

```text
        ┌────────────────┐
        │ 1.0 Auth       │ register/login → bcrypt verify → JWT issue
        └───────┬────────┘     │ role & token stored client-side
                │              ▼
        ┌───────▼────────┐
        │ 2.0 Product    │ create/update/delete → validate → DB → marketplace
        └───────┬────────┘
                │ listings feed
   ┌────────────┼───────────────┬──────────────────┐
   ▼            ▼               ▼                  ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────┐
│3.0 Orders│ │4.0 Cold  │ │5.0 Harvest   │ │6.0 Global Trade│
│ cart →   │ │ Storage  │ │ pre-booking: │ │ RFQ → match →  │
│ order →  │ │ find →   │ │ expected     │ │ offer → ship → │
│ 20% adv →│ │ quote →  │ │ harvest →    │ │ docs → export  │
│ lifecycle│ │ book →   │ │ reserve →    │ │                │
│ → events │ │ batch →  │ │ allocate     │ │                │
└────┬────┘ │ sell later│ └──────────────┘ └────────────────┘
     │      └────┬─────┘
     │           │ AI selling insight (real data + disclaimer)
     ▼           ▼
┌─────────────────────────┐    ┌───────────────────────┐
│ 7.0 Payments (demo)     │    │ 8.0 Logistics (demo)  │
│ advance/remaining/refund│    │ quote → assign → track│
│ server-side authz       │    │ distance-based pricing│
└─────────────────────────┘    └───────────────────────┘
                ▲
        ┌───────┴────────┐
        │ 9.0 AI models  │ fair-price · demand-forecast · farmer-rank
        │ (own data)     │ computed from orders/listings + seasonality
        └────────────────┘
```

All processes 1.0–9.0 are implemented; only their *providers* are demo-mode (payments, logistics).

---

## 14. UML Diagrams

### Figure 14.1 — Use Case Diagram

```text
                    KisanDirect AI System Boundary
   ┌───────────────────────────────────────────────────────────────┐
   │                                                               │
   │   (Register/Login)───all roles        (Manage Products)──FARMER│
   │   (Browse/Search Marketplace)─Consumer (Receive Orders)──FARMER│
   │   (Place Order)───────────────Consumer (Update Order Status)─▲ │
   │   (Pay Advance 20%)───────────Consumer (Book Cold Storage)─FPO│ │
   │   (Track Order live)───────────all    (List Stored Produce)─│ │
   │   (Cancel Order)─────────────Consumer (AI Sell Insight)────│ │
   │   (Review Product)───────────Consumer (Pre-book Harvest)───▼ │
   │   (Post Requirement)────────B2B      (View Demand Heatmap)─── │
   │   (Send Offer)──────────────FARMER   (Trace Batch via QR)─Pub │
   │   (Create Export RFQ)───────B2B      (Match Suppliers)─────── │
   │   (Manage Shipments)────LOGISTICS (Moderate Disputes)─ADMIN── │
   │   (Update Delivery)──────LOGISTICS (Verify Users)─────ADMIN── │
   └───────────────────────────────────────────────────────────────┘
```

### Figure 14.2 — Sequence Diagram: Place Order (happy path)

```text
Consumer      Frontend        API/OrderRoutes     OrderService        DB
   │  add to     │                 │                  │                │
   │──cart──────▶│                 │                  │                │
   │  checkout   │  POST /api/orders (JWT, zod-validated)             │
   │─────────────▶│────────────────▶│  createOrder()  │                │
   │             │                 │────────────────▶│ BEGIN TX       │
   │             │                 │                 │──load product──▶│
   │             │                 │                 │◀─price, qty────│
   │             │                 │                 │ total=qty×price│
   │             │                 │                 │ advance=20%    │
   │             │                 │                 │──insert Order──▶│
   │             │                 │                 │──status history▶│
   │             │                 │                 │ COMMIT         │
   │             │                 │                 │ recordSaleFromBatch()  (cold-storage sync, guarded)
   │             │                 │                 │ emitOrderCreated → farmer & buyer rooms
   │             │◀─201 order+advance─│◀──created─────│                │
   │◀─toast+redirect──────────────│                  │                │
```

### Figure 14.3 — Sequence Diagram: Cold-Storage Booking

```text
Farmer        Frontend         ColdStorageRoutes      ColdStorageService     DB
   │ find facilities (crop=Garlic, radius)              │                    │
   │─────────────▶ GET /api/cold-storage/facilities ────▶│──filter──────────▶│
   │◀─facility cards (capacity, rate, temp, verified)───│◀──────────────────│
   │ request quote (qty, days)                          │                    │
   │─────────────▶ POST .../facilities/:id/quote ───────▶│ validate min/cap/ │
   │◀─cost = qty×rate×days + calculation string─────────│ duration (400s)   │
   │ confirm booking                                    │                    │
   │─────────────▶ POST /api/cold-storage/bookings(JWT)─▶│ TX: capacity check│
   │                                                    │  decrement avail. │
   │                                                    │  create booking   │
   │                                                    │  create batch     │
   │                                                    │  KDA-XXX-YYYY-NNNN│
   │                                                    │  + qrToken        │
   │◀─booking PAID + batch + QR token────────────────────│◀──────────────────│
```

### Figure 14.4 — Activity Diagram: Order Lifecycle

```text
(Start) → Place order → [PENDING_ADVANCE] → pay 20% advance → [ADVANCE_PAID]
   → farmer accepts → [FARMER_ACCEPTED] → preparing → [PREPARING]
   → logistics assigned (demo) → [LOGISTICS_ASSIGNED] → [SHIPPED]
   → [DELIVERED] → (End)
Any pre-SHIPPED state ──cancel──▶ refund per policy (100%→25%) + stock restore
```

Refund percentages are policy-driven (`CancellationPolicy`) with status defaults: PENDING_ADVANCE 100%, ADVANCE_PAID 90%, FARMER_ACCEPTED 75%, PREPARING 50%, LOGISTICS_ASSIGNED 25%.

---

## 15. User Flows

### Figure 15.1 — Farmer flow (implemented)

```text
Register/Login → Farmer Dashboard (stats, live order feed)
   → Add Product (form + image + price + quantity + location)
   → Manage Products (edit / deactivate / delete)
   → Receive Order (real-time toast via Socket.IO)
   → Accept → Prepare → Hand to logistics (demo)
   → Earnings & order history
   ── Cold storage branch:
   Find Storage (map + filters) → Quote → Book (paid) → Batch stored
   → Track batch (days, cost, AI insight) → Sell later (list on marketplace)
      → or Withdraw (capacity credited)
   ── Harvest branch:
   Declare expected harvest → receive reservations → allocate on harvest
```

### Figure 15.2 — Consumer/Buyer flow (implemented)

```text
Register/Login → Browse Marketplace (search, filters, 23 languages)
   → Product details → Add to cart / Order directly
   → Checkout → Pay 20% advance (demo provider, server-validated)
   → Track order live (socket events + status history)
   → Receive delivery (demo tracking) → Review
   → or Cancel (policy refund + stock restored)
B2B buyer additionally: post requirements → receive offers → export RFQs
```

### Figure 15.3 — Cold storage "store now, sell later" flow (implemented)

```text
Harvest → Find nearby facility (map, crop filter)
   → Check capacity + price + conditions → Book (capacity reserved, batch created)
   → Store → Track batch (days stored/remaining, accumulated cost)
   → AI Selling Insight (current price vs estimated range − storage cost;
      "NOT a guaranteed price" disclaimer always shown)
   → Decide: Sell Now (list on marketplace → buyer orders → batch syncs down)
             or Continue Storing
   → or Withdraw product (capacity credited exactly once)
```

### Figure 15.4 — Authentication flow (implemented)

```text
User → login/register form (client validation)
   → POST /api/auth/login|register (Zod-validated body)
   → bcrypt compare / hash
   → JWT signed (userId, email, role) with JWT_SECRET, expiry JWT_EXPIRES_IN
   → client stores token; Axios attaches Authorization: Bearer
   → protected routes: authenticate (verify+decode) → authorize(role)
   → 401 unauthenticated · 403 wrong role
```

---

## 16. Project Metrics

Measured directly from the repository (September 2026):

| Metric | Value |
|---|---|
| Prisma models | **65** |
| API endpoints | **96** (52 GET · 33 POST · 7 PUT · 1 PATCH · 3 DELETE) |
| Backend route modules | 14 |
| Backend services | 11 |
| Zod validation schema files | 10 |
| Frontend pages | **46** (farmer 16 · consumer 8 · admin 7 · global 6 · buyer 3 · logistics 3 · public 3) |
| Client route paths | 53 |
| UI languages | **23** (incl. Santali, Bodo, Kokborok, Manipuri, Dogri, Maithili) |
| Source LOC | ≈17,900 (backend 6,381 + frontend 11,478) |
| Automated tests | 17-test contract suite + 19-check production smoke suite |
| User roles | 6 |
| Production deploy | Railway, single Docker service + PostgreSQL 18 |

---

*Continue to [02-TECHNICAL-REFERENCE.md](./02-TECHNICAL-REFERENCE.md) for the API reference, database reference, security, AI, deployment, and installation chapters — and [03-EVALUATION-AND-ANNEXURE.md](./03-EVALUATION-AND-ANNEXURE.md) for testing, quality audit, roadmap, viva preparation, and references.*
