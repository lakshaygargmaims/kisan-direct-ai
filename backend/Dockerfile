FROM node:20-slim

WORKDIR /app

# Install Prisma dependencies
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --omit=dev

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Seed database on first run (optional)
COPY prisma/seed.ts ./prisma/seed.ts

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
