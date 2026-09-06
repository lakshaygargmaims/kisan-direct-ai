# ─────────────────────────────────────────────────────────────
# KisanDirect AI — single-service production image
# One process serves the React UI, the REST API and Socket.IO.
# Deploy: Railway (root directory = repo root) or any Docker host.
# ─────────────────────────────────────────────────────────────

# ── Stage 1: build the React frontend ────────────────────────
FROM node:20-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json frontend/
RUN cd frontend && npm ci
COPY frontend/ frontend/
RUN cd frontend && npm run build

# ── Stage 2: build the backend (PostgreSQL Prisma client) ────
FROM node:20-slim AS backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci
COPY backend/ backend/
# Derive the PostgreSQL schema from the single source-of-truth dev schema,
# generate the Prisma client for it, then compile the TypeScript server.
# DATABASE_URL here is only needed by `prisma generate` — the real value is
# provided as an env var by the platform at runtime.
RUN cd backend \
    && DATABASE_URL="postgresql://kisan:kisan@localhost:5432/kisandirect" node scripts/prepare-postgres.mjs --generate \
    && npm run build

# ── Stage 3: runtime ─────────────────────────────────────────
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=backend /app/backend /app/backend
COPY --from=frontend /app/frontend/dist /app/frontend/dist
WORKDIR /app/backend

EXPOSE 3001

# Apply the schema (idempotent), seed demo data only when the DB is empty,
# then boot the single server that hosts UI + API + WebSockets.
CMD ["sh", "-c", "npx prisma db push --skip-generate --schema prisma/schema.prod.prisma && npx tsx prisma/seed.ts && node dist/server.js"]
