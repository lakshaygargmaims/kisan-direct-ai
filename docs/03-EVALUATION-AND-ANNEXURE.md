# KisanDirect AI — Evaluation, Quality & Annexure

Part 3 of 3. Covers: testing, performance & scalability, error handling, code-quality audit, risks & mitigation, limitations, future enhancements, development roadmap, viva questions, SIH/judge Q&A, glossary, references.

Status legend: 🟢 implemented · 🟡 partial · 🔵 planned.

---

## 1. Testing

### 1.1 Automated tests that exist 🟢

**A. Contract suite — `backend/tests/contract.test.mjs` (17 tests, all passing).**
Runs against a live backend and asserts the cold-storage + ordering invariants executably:

| # | Test | What it proves |
|---|------|----------------|
| 1–4 | Quote boundaries | exact cost math; min-quantity, capacity, and max-duration violations → 400 with specific messages |
| 5 | Booking | PAID status, batch code format `KDA-GAR-YYYY-NNNNNN`, facility capacity −500 exactly |
| 6 | Auth boundaries | no token → 401; consumer role on farmer endpoint → 403 |
| 7 | AI insight | price > 0, ordered range, named data source, "NOT a guaranteed price" disclaimer, sell-now revenue math |
| 8 | List from storage | 500 kg listed → FULLY_LISTED + marketplace product created |
| 9 | Over-list guard | listing beyond remaining → 400 |
| 10 | Order + batch sync | 240 kg order: total & 20% advance exact; batch 500→260, PARTIALLY_SOLD |
| 11 | Sell-out | remainder order → SOLD_OUT; further orders → 400 |
| 12 | **RACE: orders** | 3 concurrent × 250 kg vs 500 stock → **exactly 2 succeed**; SOLD_OUT; listed=0 |
| 13 | **RACE: sells** | 2 concurrent × 300 kg for last 300 → exactly 1 succeeds |
| 14 | **RACE: withdrawals** | 2 concurrent withdraws → exactly 1 succeeds; capacity credited once |
| 15 | Withdraw guard | blocked while listings active (400 with message) |
| 16 | QR traceability | public trace works; regex-proves **no farmer PII**; facility shown |
| 17 | Inventory read model | computed fields (daysStored, daysRemaining, availableToSell) correct; consumer cannot read batches (403) |

The suite is **re-runnable**: a preamble clears Garlic test batches and restores facility capacity, leaving the database as found.

**B. Production smoke suite — `.freebuff/prod-smoke.mjs` (19 checks, all passing).**
Same flows executed against the live Railway deployment **over the public internet**, plus: health/DEMO-mode check, UI bundle served with **no hardcoded localhost API**, registration + duplicate-email rejection, bogus-token rejection, and concurrency races over real network latency (observed statuses `[201, 400, 201]` — atomicity holds in production).

### 1.2 Manual verification performed 🟢

- Full UI walkthrough in a live browser: landing page, demo logins per role, dashboards, marketplace (127 products at test time), add-product form, cold-storage pages — zero console errors
- Auth-guard behavior: consumer route while logged in as farmer → redirect to landing
- Data hygiene audits: orphaned listings, negative stock, zero-quantity listings — all detected and repaired during development cycles

### 1.3 Test-case table (representative, from actual behavior)

| ID | Module | Case | Input | Expected | Actual | Status |
|----|--------|------|-------|----------|--------|--------|
| TC-01 | Auth | valid login | farmer@demo.com / demo123 | 200 + JWT | 200 + JWT | ✅ |
| TC-02 | Auth | wrong password | farmer@demo.com / nope | 401 | 401 | ✅ |
| TC-03 | Auth | duplicate email | existing email | 400 | 400 | ✅ |
| TC-04 | Orders | money math | 240 × ₹40 | total 9600, advance 1920 | 9600 / 1920 | ✅ |
| TC-05 | Orders | oversell | 10 kg vs 0 stock | 400 | 400 | ✅ |
| TC-06 | Orders | race | 3×250 vs 500 | exactly 2 succeed | 2 succeed | ✅ |
| TC-07 | Cold storage | quote math | 500 × ₹1.20 × 15 | 9000 | 9000 | ✅ |
| TC-08 | Cold storage | booking | 500 kg | PAID + batch + capacity −500 | as expected | ✅ |
| TC-09 | Cold storage | withdraw race | 2 concurrent | 1 succeeds, capacity once | as expected | ✅ |
| TC-10 | AI | disclaimer | any insight | "NOT a guaranteed price" present | present | ✅ |
| TC-11 | Trace | PII | QR token page | no farmer identity | clean | ✅ |
| TC-12 | Payments | tampered amount | advance + 100000 | rejected server-side | rejected | ✅ |
| TC-13 | Payments | double payment | pay twice | second → 400 | 400 | ✅ |
| TC-14 | Cancellation | stock restore | cancel once | restored exactly once | once | ✅ |
| TC-15 | Cancellation | double cancel | cancel again | 400 (idempotent-safe) | 400 | ✅ |

### 1.4 Testing gaps 🔵

- No unit-test framework wired (tests are HTTP-level end-to-end); adding Vitest/Jest for service-layer units is recommended
- No CI pipeline running the suites on push (the repo has only a keep-alive workflow)
- No frontend component tests or visual regression
- No load testing beyond the concurrency races (recommend k6/autocannon before scale claims)

---

## 2. Performance & Scalability

**Current optimizations (present in code):** Prisma indexes on hot lookup paths; AI queries scoped to 60–90-day windows with aggregation rather than full scans; single-process serving (no internal hop between UI and API); React Query caching on the client; pagination on product listing; static frontend served from the same process (no separate CDN round-trip in prod).

**Measured observations:** production API responses sub-second over the public internet during the smoke run; the heavy pages are map tiles (client-side, provider-CDN).

**Scalability path:**

| Stage | Change |
|---|---|
| Now | 1 app container + 1 Postgres (Railway), stateless JWT → vertical headroom first |
| Next | Horizontal app replicas behind Railway load balancer (safe: no in-memory session); move any recurring heavy AI computation to a cached/queued job |
| Later | Read replicas for analytics; Redis cache for hot marketplace queries; object storage (S3/Cloudflare R2) for product images instead of local; dedicated AI service when models outgrow in-process statistics; Socket.IO adapter (Redis) for multi-node websocket rooms |

Honest limits: single Postgres instance; websockets assume sticky awareness at >1 replica; image storage is local-disk today.

---

## 3. Error Handling

**Backend (centralized `errorHandler.ts`):** `AuthError` → its status; `ZodError` → 400 with field details; Prisma `P2025` → 404; Prisma known codes mapped; fallback → 500 with **no stack trace leaked** to the client (server-side `console.error` keeps context). Every response shape is `{ success: false, error }`.

**Business errors** throw typed errors inside services (e.g., "Minimum quantity is X kg", "Maximum storage duration is Y days", "Order is already cancelled", "N kg already listed/active listings") — surfaced as 400s with human-readable messages, verified by tests.

**Resilience patterns in place:** order→batch sync failures are logged, not thrown (order integrity first); socket emissions wrapped in try/catch (headless-test safe); external providers are demo-implemented so no network failure path exists yet (relevant again when live providers land).

**Frontend:** loading states (PageLoader, skeletons), error toasts (sonner) on failed mutations, empty states on lists, ErrorBoundary on render crashes; Axios interceptor normalizes API errors before UI handling.

---

## 4. Code Quality Audit

Documentation-level audit of the real codebase:

| # | Finding | Severity | Where | Improvement |
|---|---------|----------|-------|-------------|
| 1 | `express-rate-limit` installed but never applied | Medium | `backend/src/server.ts` | Wire a limiter on `/api/auth/*` and mutation routes |
| 2 | `AI_SERVICE_URL` config unused | Low | `backend/src/config/index.ts` | Remove or implement the external-AI path |
| 3 | Product↔batch linkage by product **name** (`Garlic (Cold Storage …)`) instead of FK | Medium | `order.service.ts` / `cold-storage.service.ts` | Add `batchId` FK on Product for structural sync |
| 4 | Controllers inline in route files | Low | all routers | Acceptable at current size; extract if a router grows beyond ~400 lines |
| 5 | `any` typing in transaction callbacks | Low | services (`tx: any`) | Type with `Prisma.TransactionClient` |
| 6 | String enums (no Prisma enum type) | Low | schema | PostgreSQL-only enum types, or keep Zod as single guard (current state works, but validation is the only enforcement) |
| 7 | Two large seed files with overlapping concerns | Low | `prisma/seed*.ts` | Merge guarded seeders into one orchestrator |
| 8 | Frontend pages occasionally duplicate form logic | Low | farmer pages | Extract shared form primitives |
| 9 | Test suite is HTTP-level only | Medium | `backend/tests/` | Add service-layer unit tests |
| 10 | No CI on push | Medium | `.github/workflows/` | Add typecheck + contract suite workflow |

No critical findings: no plaintext secrets in repo, no raw SQL, no unvalidated route inputs, no client-trusted money values.

---

## 5. Risks & Mitigation

| Risk | Probability | Impact | Mitigation (current → recommended) |
|---|---|---|---|
| DB connection failure | Low | High | Railway same-network Postgres; restart policy ON_FAILURE → add connection-pool alerts |
| Concurrent-inventory bug | Low (guarded, tested) | High | Atomic transactions + race tests stay in suite for every schema change |
| Demo payment provider mistaken for real | Medium (demo label) | Medium | UI/mode shows "DEMO"; before launch, swap provider via env only |
| AI misread as guaranteed price | Medium | Medium | Mandatory disclaimer strings, contract-tested |
| Data loss (volume) | Low | High | Railway volume backups → scheduled `pg_dump` to object storage |
| Secret leakage | Low | High | Env-only secrets, git-ignored; rotate JWT_SECRET on suspicion |
| Abuse of open register endpoint | Medium | Medium | 🟡 add rate limiting + verification emails (planned) |
| Map tile provider outage | Low | Low | Maps degrade to list views; coordinates still functional |
| Scale bottleneck (single node) | Medium | Medium | Stateless design → add replicas (see Scalability) |

---

## 6. Limitations (honest)

- Payments, logistics dispatch, email/SMS are **demo providers** — no real money moves, no real trucks dispatch
- Mandi prices are a static dataset, not a live data.gov.in feed
- AI is descriptive statistics from platform data, not trained ML; sparse products fall back to labeled demo values
- Rate limiting, security headers, and refresh-token flow not yet wired
- Single-region deployment; websocket scaling needs an adapter beyond one replica
- No native mobile app (web is responsive)
- Cold-storage facilities, demand zones, collection hubs ship as seeded demo networks

---

## 7. Future Enhancements 🔵

| Feature | Value | Notes |
|---|---|---|
| Live mandi prices (data.gov.in API) | Transparency + trust | endpoint shape already exists for the swap |
| Razorpay live payments | Real transactions | config-ready |
| Porter live logistics | Real dispatch | config-ready |
| Weather alerts (OpenWeatherMap) | Protect crops & plan harvest | farmer-location aware |
| Demand forecasting upgrades (ML) | Better estimates | move from statistics to learned models as data grows |
| IoT cold-storage monitoring | Real temperature telemetry | partner API |
| FPO aggregation tools | Bulk member listing | FPO role exists; deepen workflows |
| Mobile app (React Native) | Field usability for farmers | reuse the REST API unchanged |
| Notification channels (email/SMS/WhatsApp) | Reach beyond the app | provider config exists |
| Advanced analytics dashboards | Decision support | Recharts foundation present |

---

## 8. Development Roadmap

**Phase 1 — Current MVP 🟢 (done):** 6-role marketplace, atomic ordering + payments (demo), cold storage with AI insight, harvest pre-booking, global-trade module, demand analytics, 23-language UI, production deployment on Railway, contract + smoke suites.

**Phase 2 — Production hardening (recommended next, ~2–4 weeks):** CI (typecheck + contract suite on push), rate limiting + security headers, refresh tokens, live payment + logistics providers, scheduled DB backups, error monitoring (Sentry), load test baseline.

**Phase 3 — Scale (~1–3 months):** live mandi integration, ML-based price/demand models with evaluation harness, object storage for images, multi-replica websocket adapter, regional deployment, mobile app, FPO/aggregation deep workflows, government-scheme integrations.

---

## 9. Viva Preparation — 110 Questions with Answers

### A. Basic (30)

1. **What is KisanDirect AI?** A full-stack marketplace connecting farmers/FPOs directly with consumers and B2B buyers, with AI price/demand estimates, order clubbing, cold storage, harvest pre-booking, and export workflows.
2. **What problem does it solve?** Middlemen capture margin; farmers lack direct market access, price visibility, storage options, and affordable logistics.
3. **What does the tagline mean?** "From Farm to Buyer. Direct. Fair. Smart." — direct trade, fair (data-derived) prices, smart (AI-assisted) decisions.
4. **Which SIH problem statement?** PS26033.
5. **Who are the users?** Six roles: Farmer, FPO, Consumer, B2B Buyer, Logistics partner, Admin.
6. **Frontend stack?** React 18, TypeScript, Vite, Tailwind, Radix UI, React Router, TanStack Query, Zustand, MapLibre, Recharts, i18next.
7. **Backend stack?** Node.js, Express, TypeScript, Prisma, JWT, bcrypt, Socket.IO, Zod.
8. **Database?** SQLite in development, PostgreSQL 18 in production, via Prisma.
9. **How many models?** 65.
10. **How many endpoints?** 96 (52 GET, 33 POST, 7 PUT, 1 PATCH, 3 DELETE).
11. **How many pages?** 46 across 7 role areas; 53 client routes.
12. **Which languages does the UI support?** 23, including Santali, Bodo, Kokborok, Manipuri, Dogri, Maithili.
13. **How is the app deployed?** Single Docker image on Railway with PostgreSQL 18; health check `/api/health`.
14. **What is the advance payment?** 20% of order total, computed server-side.
15. **How are refunds computed?** Policy-driven percentage by order status (100% at PENDING_ADVANCE → 25% after LOGISTICS_ASSIGNED).
16. **What is order clubbing?** Grouping nearby/compatible orders to share logistics and cut per-kg cost.
17. **What is cold storage for?** Store produce safely and choose when to sell — avoiding distress sales.
18. **What is a batch?** A uniquely-coded stored quantity (`KDA-XXX-YYYY-NNNNNN`) tracked through listing and sale.
19. **What is the QR code for?** Public traceability: product, batch, dates, facility, grade — no farmer PII.
20. **What AI features exist?** Fair-price estimate, demand forecast, farmer ranking, cold-storage selling insight.
21. **Do you call an external AI API?** No — statistics computed in-process from the platform's own order data.
22. **Do you train models?** No — descriptive statistics with seasonal factors.
23. **Are AI prices guaranteed?** Never — every output carries a "NOT a guaranteed price" disclaimer.
24. **How do farmers get paid?** Demo provider records advance/remaining/refund; real gateway is config-ready.
25. **Is delivery real?** Demo provider computes distance-based quotes and tracking; Porter integration is config-ready.
26. **How is real-time achieved?** Socket.IO rooms per user/order with order lifecycle events.
27. **How do you prevent overselling?** Atomic DB transactions; concurrency races are tested.
28. **How are passwords stored?** bcrypt, 10 rounds.
29. **How is the API validated?** Zod schemas on every route before business logic.
30. **Where is the code?** github.com/lakshaygargmaims/kisan-direct-ai.

### B. Technical (30)

1. **Why single-service deployment?** Same-origin API calls, lowest cost, one health check; scales horizontally as a unit.
2. **Why Prisma?** Typed client, declarative schema, parameterized queries (SQL-injection-safe), dual-datasource support.
3. **How does dev/prod schema split work?** `scripts/prepare-postgres.mjs` derives `schema.prod.prisma` from the SQLite source at Docker build.
4. **Why SQLite in dev?** Zero-setup local runs; identical Prisma API, so code is datasource-agnostic.
5. **What's in the Dockerfile?** Three stages: build frontend dist, build backend tsc, runtime image running schema push + guarded seeds + server.
6. **Why `db push` not `migrate` in prod?** Idempotent declarative apply suits a stateless container start; migrations remain available for team workflows.
7. **How is JWT structured?** Payload `{userId, email, role}`, HS256, 7-day expiry, verified by `authenticate()` middleware.
8. **How does `authorize()` work?** Closure over allowed roles; compares `req.user.role`; 403 on mismatch.
9. **How are transactions used?** `prisma.$transaction` wraps order creation, cancellation, booking, selling, withdrawal — status re-checks live inside the transaction to kill race windows.
10. **Why is batch sync post-commit?** Order integrity first; sync failures log for reconciliation rather than failing the order.
11. **How does the AI fair-price work?** Mean of 90-day order prices blended with listing prices × seasonal factor; range from dispersion; dataSource labeled.
12. **How does demand forecasting work?** 60-day orders grouped by day-of-week → pattern → next-N-day projection.
13. **How is capacity conserved?** `availableCapacityKg` decremented on booking, credited on withdrawal inside transactions; tested that concurrent withdrawals credit exactly once.
14. **How are batch quantities derived?** `currentQtyKg` (stored), `listedQtyKg` (on marketplace), `soldQtyKg` (sold) with invariants asserted by tests (500→260→0; sold 240 etc.).
15. **What is the CORS allow-list logic?** Same-origin match, FRONTEND_URL, CORS_ORIGINS list, *.vercel.app, localhost — else blocked.
16. **How does the frontend call the API?** Axios with relative `/api` base (same-origin) — prevents hardcoded-host bugs; VITE_API_URL override exists.
17. **Why TanStack Query + Zustand?** Query owns server cache/retries; Zustand owns session + cart.
18. **Why MapLibre over Google Maps?** Open-source, no API key/billing; raster tiles free.
19. **How does i18n work?** i18next with 23 JSON locale packs, browser language detection, per-page translation keys.
20. **How are sockets secured?** Token-authenticated handshake, rooms `user:<id>` and `order:<id>` so events reach only parties.
21. **What happens when an order is cancelled?** Single transaction: status re-check → refund % by policy → stock increment → history row; second cancel 400s.
22. **How are quotes computed?** qty × rate × days server-side with boundary checks (min qty, capacity, max duration) → 400s with messages.
23. **Why string enums in Prisma?** Cross-datasource (SQLite/Postgres) compatibility; Zod is the single validation authority.
24. **How does seed idempotency work?** Count guards skip when data exists; production start is safe on every boot.
25. **What does the health check verify?** Process + (implicitly) DB liveness; Railway uses it for deploy gating and restarts.
26. **How do you test concurrency?** Fire parallel HTTP requests in the contract suite and assert exact success counts and final quantities.
27. **How is PII kept off public endpoints?** Trace endpoint selects only non-identity fields; tests regex-assert no email/name leakage.
28. **What's the error envelope?** `{success:false,error}` with mapped statuses (AuthError→its code, Zod→400, P2025→404, else 500 sans stack).
29. **Why a contract suite instead of only unit tests?** It pins the externally observable behavior (status codes, money math, invariants) — the part consumers depend on.
30. **How would you add a live provider?** Env `*_PROVIDER` switch + key vars; services are already provider-shaped, so swap implementation behind the same interface.

### C. Architecture (20)

1. **Draw the high-level architecture.** (See Figure 11.1 — users → single service (SPA + API + socket) → Prisma → Postgres; demo providers for payment/logistics.)
2. **Why not microservices?** Hackathon-scale team/product; modular monolith with 11 services gives clean boundaries without operational overhead.
3. **How does the SPA get served?** Express serves `frontend/dist` statically in production — one origin.
4. **Where does business logic live?** Services layer; routes stay thin adapters.
5. **How do modules avoid cross-talk?** They depend on services/Prisma, not on each other's routes; shared emit helpers for sockets.
6. **How would you extract a service later?** Cold-storage is the cleanest boundary (own models, owner-scoped API) — lift with its service file + models.
7. **Why keep AI in-process?** Latency-free, zero-cost, no external dependency; the models are SQL-backed statistics.
8. **What's the data flow for an order?** (See Figure 14.2 sequence — client → validated route → service transaction → sync + emit → response.)
9. **Where can it bottleneck first?** Postgres connections and marketplace search queries — both have clear scale paths (pooling, indexes, cache).
10. **How is statelessness achieved?** JWT identity, no server sessions; socket rooms are the only per-connection state.
11. **What breaks first with 2+ replicas?** Socket.IO room affinity → needs Redis adapter; app logic is safe.
12. **Why a custom CORS util instead of cors()?** Needs same-origin dynamic match + vercel wildcard logic — clearer as explicit code.
13. **How are long-running tasks handled?** None currently exceed request scope; a future ML job would move to a queue/worker.
14. **Why is seed run in the container start?** Guarantees a demo-usable environment on any fresh deploy without manual steps.
15. **How does the build guarantee prod schema correctness?** The Docker build fails fast if Prisma can't generate/compile — schema errors block deploy.
16. **Why is the frontend not on a CDN?** Cost/simplicity; static assets from the same node are fast enough at demo scale — CDN is a drop-in later.
17. **What's the deployment failure mode?** Health-check timeout (300s) → Railway keeps old deployment; restart policy caps crash loops.
18. **How do you roll back?** Redeploy a previous commit/image; Postgres is untouched by app redeploys (schema push is additive).
19. **What is the scaling unit?** The whole container (UI+API+socket) — replicate N identical units.
20. **Why PostgreSQL for prod?** Relational integrity for 65 models, concurrent transactions (atomic inventory), free-tier managed hosting.

### D. Database (20)

1. **How many models and how are they grouped?** 65 — identity, catalog, orders/payments, delivery, cold storage, harvest, global trade, market intelligence, platform ops.
2. **Primary key strategy?** CUID strings (`@id @default(cuid())`) — URL-safe, no autoincrement leakage.
3. **How is the User related to profiles?** One-to-one per role type (FarmerProfile, ConsumerProfile, …) — role-specific fields without a giant table.
4. **Order's key fields?** buyerId, farmerId, productId, quantity, pricePerKg, totalAmount, advanceAmount, remainingAmount, status, delivery coords.
5. **How is money integrity kept?** Amounts computed in services from DB values; payment rows carry providerReference; tampered client amounts rejected.
6. **OrderStatusHistory purpose?** Immutable audit of every transition with notes (incl. cancellation reason/refund).
7. **How does StoredBatch track quantities?** initial/current/listed/sold qty fields with invariant `initial = current + sold` (current includes listed), enforced by guarded updates + tests.
8. **How is capacity conserved?** Booking decrements facility.availableCapacityKg; withdrawal credits it once — both in transactions.
9. **What does batchCode encode?** `KDA-<CROP>-<YEAR>-<SERIAL>` — human-readable traceability.
10. **qrToken?** Opaque public token identifying a batch for the trace page; no PII derivable.
11. **ColdStorageFacility key fields?** Capacity/available, temp range, supportedCrops (JSON), pricePerKgPerDay, minQuantityKg, maxDurationDays, rating, isVerified.
12. **CancellationPolicy?** Active policy row consumed by cancellation to pick refund % by status.
13. **OrderClub design?** Club + members linking orders for shared logistics.
14. **How are products protected from deletion with history?** deleteProduct blocked when orders reference the product.
15. **Which models support AI?** Order (history), Product (listings), PriceHistory, MarketPrice, DemandForecast, PricePrediction, DemandZone/Snapshot.
16. **Global-trade model chain?** RFQ(+items) → SupplierMatch → SupplyAggregation → ExportOffer → ShippingEstimate → ExportShipment(+Status) → ExportDocument(+Requirements).
17. **Harvest chain?** ExpectedHarvest(+images) → Reservation → Allocation → Delay → BuyerMatch → HarvestPayment.
18. **Why JSON columns (crops)?** Variable-length simple lists; avoids join tables where relational semantics aren't needed.
19. **Indexing approach?** Prisma default unique indexes (email, batchCode, qrToken) + relation indexes; hot filters (product name/category) rely on search scoping.
20. **Dev→prod data strategy?** Seeds are guarded (idempotent); dev.db is git-ignored; prod data lives in Railway volume.

### E. AI (20)

1. **Is AI real in this project?** Yes — real computations over real platform data; but statistical, not trained ML.
2. **Why not call GPT/Gemini?** Cost, latency, and reliability for a numeric estimation task; own-data statistics are deterministic and free.
3. **Why not train a model?** Data volume (early platform) doesn't support training; statistics are honest and explainable — training is Phase 3.
4. **What is the fair-price algorithm?** Mean(90-day order prices) blended with mean(active listing prices) × seasonal factor; output = point + range.
5. **Seasonal factors?** spring 1.05, summer 0.95, monsoon 1.10, winter 1.00.
6. **What is the demand forecast algorithm?** Day-of-week demand pattern from 60-day orders → next-N-day quantities + price trend.
7. **What is farmer ranking?** Scoring farmers on fulfillment/quality signals for buyer recommendations.
8. **What is the cold-storage insight?** Current price vs estimated future range minus accrued storage cost → sell-now vs hold comparison.
9. **How is honesty enforced?** Mandatory disclaimer strings; dataSource labeling; tests fail if the disclaimer is missing.
10. **What are the dataSource values?** LIVE_PLATFORM_DATA, RECENT_ORDERS, CURRENT_LISTINGS, MANDI_REFERENCE, DEMO_FALLBACK.
11. **Cold start (no orders)?** Falls through the source chain to MANDI_REFERENCE then DEMO_FALLBACK, clearly labeled.
12. **Could predictions be wrong?** Yes — that's why wording is "estimated/potential" and never "guaranteed".
13. **Where does the AI code live?** `backend/src/routes/ai.routes.ts` + `cold-storage.service.ts` (insight).
14. **Is there bias risk?** Platform data reflects platform users; as data grows, evaluation and de-biasing become necessary (Phase 3).
15. **How would external AI integrate?** `AI_SERVICE_URL` slot exists; would call a FastAPI service for LLM-heavy tasks (currently unused).
16. **How is AI output validated?** Range ordering, positivity, and revenue math asserted in tests.
17. **What triggers recomputation?** Per-request computation over rolling windows — always current.
18. **Performance?** Two scoped queries + arithmetic per call — milliseconds.
19. **Why show a range not a point?** Communicates uncertainty honestly.
20. **What data would improve it most?** Time-series price history per region + weather + mandi live feeds (planned).

### F. Security (20)

1. **How are passwords secured?** bcrypt 10 rounds; never logged or returned.
2. **How does JWT auth work?** Sign {userId,email,role} with secret; verify per request; role re-checked per route.
3. **Token expiry?** 7 days (configurable); no refresh flow yet (known limitation).
4. **Where is the secret stored?** Env var only; Railway variable in prod; random at deploy; never in repo.
5. **SQL injection?** Prisma parameterization everywhere; no raw SQL.
6. **XSS?** React escapes by default; no dangerouslySetInnerHTML usage in the audited paths.
7. **CSRF?** Token-in-header pattern (not cookies) → classic CSRF inapplicable; no cookie sessions.
8. **Rate limiting?** 🟡 Installed, not wired — top hardening item.
9. **CORS policy?** Explicit allow-list incl. same-origin; unknown origins blocked.
10. **IDOR?** Owner checks on orders/batches/products; cross-role access tested (403).
11. **Authorization vs authentication here?** authenticate = who you are (JWT); authorize = role gate per route.
12. **Are client-sent amounts trusted?** Never — totals/advance/refunds/quotes recomputed server-side (tested with tampered values).
13. **Double-payment protection?** Status re-check inside transaction; second attempt 400.
14. **What's exposed publicly without auth?** Marketplace reads, facility reads, quotes, and the PII-free trace page.
15. **Is the trace endpoint safe?** Yes — selects only product/batch/facility/grade fields; regex-tested for PII.
16. **Secrets in frontend?** None — providers are server-side; bundle checked for hardcoded hosts/keys.
17. **HTTPS?** Railway edge TLS.
18. **Missing hardening?** Helmet headers, refresh tokens, 2FA — all recommended next steps.
19. **Audit trail?** AuditLog model + OrderStatusHistory capture administrative and order events.
20. **What happens on secret compromise?** Rotate JWT_SECRET (invalidates all tokens) and DB credentials; env-only change.

### G. SIH / Judges (20)

1. **What is the innovation?** Own-data AI pricing + cold-storage "store now, sell later" + harvest pre-booking + export enablement in one direct-trade platform.
2. **What's working right now, live?** The full marketplace→order→payment flow, cold storage booking→listing→sale, AI insights, traceability — deployed and smoke-tested on Railway.
3. **How do you prove it works?** 17-test contract suite + 19-check production smoke suite; concurrency races show atomic inventory live.
4. **How does the farmer earn more?** Direct sales remove intermediaries; AI pricing informs timing; storage prevents distress sales; clubbing cuts logistics cost.
5. **What happens without internet in villages?** Out of current scope — responsive web works on low bandwidth; offline-first is future work.
6. **Is it ready for real farmers?** Functionally for demo/pilot; real payments/logistics and vernacular voice UX are the pre-launch gap.
7. **How does it handle scale?** Stateless + Postgres → horizontal replication; clear cache/CDN/queue path (see Scalability).
8. **How is it secure?** bcrypt/JWT/RBAC/Zod/Prisma/allow-listed CORS, server-side money math, PII-free public endpoints; gaps disclosed honestly.
9. **What does it cost to run?** Single small Railway service + Postgres — free-tier/hobby viable; the cheapest credible production shape.
10. **Why should the government adopt this?** FPO-ready, 23 official languages incl. tribal languages, export enablement, auditable transactions.
11. **What's the AI's data source?** The platform's own orders and listings — no fabricated numbers; source labeled per response.
12. **What if two buyers buy the last stock simultaneously?** One wins — enforced by DB transactions, proven by a live race test.
13. **How do farmers trust AI prices?** Estimates shown as ranges with disclaimers + real mandi comparison data; never a directive.
14. **What's the business model?** Platform fee on transactions (model field exists); cold-storage commission; premium buyer analytics.
15. **What was the hardest technical problem?** Inventory atomicity across marketplace and cold-storage batches under concurrency — solved with transactional guards and race tests.
16. **What's not implemented yet?** Live payments/logistics, live mandi feed, rate limiting, mobile app — all listed with plans.
17. **How long for a real pilot?** With live providers + monitoring (Phase 2): weeks, not months.
18. **How is data privacy handled?** Minimal PII, owner-scoped reads, no public farmer identity, secrets env-only.
19. **What does "fair" mean concretely?** Prices derived from actual platform transactions, mandi comparison context, and clearly-labeled uncertainty.
20. **Why this stack?** TypeScript end-to-end (safety), Prisma (integrity), Postgres (concurrency), single Docker (cost), React+Vite (velocity) — boring, proven, cheap.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| API | Application Programming Interface — how frontend and backend communicate over HTTP |
| REST | Resource-oriented HTTP API style (GET/POST/PUT/PATCH/DELETE) |
| Endpoint | A specific URL+method the API answers (e.g., `POST /api/orders`) |
| ORM / Prisma | Object-Relational Mapper; Prisma provides typed, parameterized DB access |
| JWT | JSON Web Token — signed identity token carrying userId/email/role |
| bcrypt | Password-hashing function (one-way, salted, 10 rounds here) |
| CRUD | Create, Read, Update, Delete |
| Zod | TypeScript-first schema validation library |
| Middleware | Express functions that run before/around handlers (auth, validation, errors) |
| Transaction | All-or-nothing group of DB operations — the basis of atomic inventory |
| Race condition | Two concurrent operations interleaving badly; prevented and tested here |
| Idempotent | Safe to repeat — e.g., seeds that skip when data exists |
| CORS | Browser rule controlling which origins may call the API |
| RBAC | Role-Based Access Control — permissions by role (6 roles here) |
| IDOR | Insecure Direct Object Reference — accessing others' objects; blocked via owner checks |
| Socket.IO | Websocket layer for real-time events (order lifecycle) |
| SPA | Single-Page Application (React) |
| FPO | Farmer Producer Organization |
| Mandi | Traditional agricultural wholesale market (APMC) |
| APMC | Agricultural Produce Market Committee |
| RFQ | Request For Quotation (export workflow) |
| Batch / Lot | A uniquely identified stored quantity of produce |
| CUID | Collision-resistant unique ID used for primary keys |
| DFD / ER / UML | Data Flow Diagram / Entity-Relationship / Unified Modeling Language |
| CI/CD | Continuous Integration/Delivery — automated build+test+deploy (planned) |

---

## 11. References

Only technologies actually used in this codebase:

1. React — https://react.dev
2. TypeScript — https://www.typescriptlang.org
3. Vite — https://vitejs.dev
4. Tailwind CSS — https://tailwindcss.com
5. Radix UI — https://www.radix-ui.com
6. TanStack Query — https://tanstack.com/query
7. Zustand — https://github.com/pmndrs/zustand
8. React Router — https://reactrouter.com
9. MapLibre GL JS — https://maplibre.org
10. Recharts — https://recharts.org
11. i18next — https://www.i18next.com
12. Express — https://expressjs.com
13. Prisma ORM — https://www.prisma.io/docs
14. PostgreSQL — https://www.postgresql.org/docs
15. Socket.IO — https://socket.io/docs
16. Zod — https://zod.dev
17. jsonwebtoken — https://github.com/auth0/node-jsonwebtoken
18. bcryptjs — https://github.com/dcodeIO/bcrypt.js
19. Docker — https://docs.docker.com
20. Railway — https://docs.railway.app
21. data.gov.in (mandi dataset source) — https://data.gov.in
22. Smart India Hackathon — https://www.sih.gov.in

---

*Back to [01-PROJECT-DOCUMENTATION.md](./01-PROJECT-DOCUMENTATION.md) · Technical details in [02-TECHNICAL-REFERENCE.md](./02-TECHNICAL-REFERENCE.md)*
