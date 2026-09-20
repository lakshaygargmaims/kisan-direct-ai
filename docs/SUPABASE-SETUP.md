# KisanDirect AI — Supabase PostgreSQL Setup Guide

## Overview

This guide walks you through setting up a free PostgreSQL database on Supabase for KisanDirect AI. The free tier provides:
- 500MB database storage
- 50,000 monthly active users
- 500MB file storage
- Built-in authentication
- Real-time subscriptions

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

## Step 2: Create a New Project

1. Click **"New Project"**
2. Enter project details:
   - **Organization**: Select or create one
   - **Project name**: `kisandirect-ai`
   - **Database password**: Create a strong password (save this!)
   - **Region**: Choose **Mumbai (ap-south-1)** for India
3. Click **"Create new project"**
4. Wait 1-2 minutes for the project to be created

## Step 3: Get the Connection String

1. In your project dashboard, click **"Settings"** (gear icon) → **"Database"**
2. Scroll to **"Connection string"**
3. Select **"URI"** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

## Step 4: Update Your Backend .env

Create or update `kisan-direct-ai/backend/.env`:

```bash
# PostgreSQL Connection (from Supabase)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Auth
JWT_SECRET="kisan-direct-dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# Demo mode providers
MAP_PROVIDER="demo"
PAYMENT_PROVIDER="demo"
LOGISTICS_PROVIDER="demo"
STORAGE_PROVIDER="local"
EMAIL_PROVIDER="demo"
SMS_PROVIDER="demo"
```

## Step 5: Run the Migration

From the project root:

```bash
# Navigate to backend
cd kisan-direct-ai/backend

# Install dependencies (if not already)
npm install

# Generate Prisma client
npx prisma generate

# Push the schema to PostgreSQL
npx prisma db push

# Seed the database with demo data
npm run db:seed
```

## Step 6: Verify the Migration

1. Go to your Supabase dashboard
2. Click **"Table Editor"** in the left sidebar
3. You should see all the tables created:
   - `User`
   - `FarmerProfile`
   - `Product`
   - `Order`
   - `Payment`
   - And 50+ other tables

## Step 7: Update Railway Environment Variables

When deploying to Railway:

1. Go to your Railway project
2. Click on your backend service
3. Go to **"Variables"** tab
4. Add:
   ```
   DATABASE_URL=postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

## Troubleshooting

### Error: "Authentication failed"
- Check your database password
- Make sure you're using the **pooler** connection string (port 6543)
- Try resetting your database password in Supabase settings

### Error: "Connection refused"
- Ensure your IP is allowed (Supabase allows all IPs by default)
- Check if the project is paused (free tier pauses after inactivity)

### Error: "Database already exists"
- Run `npx prisma db push --force-reset` (WARNING: This deletes all data!)

## Free Tier Limitations

- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **Connections**: 60 concurrent
- **Pauses after**: 7 days of inactivity

For a hackathon demo, the free tier is more than sufficient.

## Switching Back to SQLite (Development)

If you want to use SQLite for local development:

1. Update `backend/.env`:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ```

2. Update `schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Run:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

## Next Steps

After setting up Supabase, you can:
1. Use the Table Editor to view and edit data
2. Enable Row Level Security for production
3. Use Supabase Auth for user management
4. Use Supabase Storage for file uploads
5. Use Supabase Realtime for live updates

## Support

If you encounter issues:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Join the [Supabase Discord](https://discord.supabase.com)
- Open an issue in the project repository
