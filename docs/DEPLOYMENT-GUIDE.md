# KisanDirect AI — Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                     │
│                                                         │
│   React 18 + TypeScript + Vite 5 + Tailwind CSS        │
│   Zustand | React Router | Recharts | MapLibre GL      │
│   i18next (23 languages) | Socket.io-client            │
└─────────────────────────────┬───────────────────────────┘
                              │ REST API + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Railway)                     │
│                                                         │
│   Node.js + Express + TypeScript                       │
│   Prisma ORM | JWT Auth | Zod Validation               │
│   Socket.io (real-time) | Rate Limiting                │
└─────────────────────────────┬───────────────────────────┘
                              │ Prisma Client
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE (Supabase)                   │
│                                                         │
│   PostgreSQL 55+ models | Normalized schema            │
│   Users, Products, Orders, Payments, AI Models         │
└─────────────────────────────────────────────────────────┘
```

## Cost Summary

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel | Hobby (free) | $0/month |
| Backend | Railway | Hobby ($5 free credit) | $0-5/month |
| Database | Supabase | Free tier (500MB) | $0/month |
| Maps | MapLibre GL | Self-hosted tiles | $0/month |
| **TOTAL** | | | **$0-5/month** |

---

## Step 1: Set Up Supabase Database

1. Create account at [https://supabase.com](https://supabase.com)
2. Create new project named `kisandirect-ai`
3. Region: **Mumbai (ap-south-1)**
4. Save your database password!
5. Go to Settings → Database → Connection string → URI
6. Copy the connection string

See [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) for detailed instructions.

---

## Step 2: Configure Backend Environment

Update `kisan-direct-ai/backend/.env`:

```bash
# Database — PostgreSQL from Supabase
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Server
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://kisandirect.vercel.app"

# Auth — Generate a strong secret for production
JWT_SECRET="your-production-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# Demo mode
MAP_PROVIDER="demo"
PAYMENT_PROVIDER="demo"
LOGISTICS_PROVIDER="demo"
STORAGE_PROVIDER="local"
```

---

## Step 3: Deploy Backend to Railway

1. Go to [https://railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Select the `kisan-direct-ai` folder
6. Railway will auto-detect the Node.js project
7. Go to **Settings** → **Networking**:
   - Enable **Public Network**
   - Set port to **3001**
8. Go to **Variables** and add:
   ```
   DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=your-production-jwt-secret-here
   NODE_ENV=production
   FRONTEND_URL=https://kisandirect.vercel.app
   ```
9. Railway will auto-deploy
10. Note your backend URL: `https://kisandirect-backend.up.railway.app`

---

## Step 4: Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `kisan-direct-ai/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variable:
   ```
   VITE_API_URL=https://kisandirect-backend.up.railway.app
   ```
7. Click **"Deploy"**
8. Note your frontend URL: `https://kisandirect.vercel.app`

---

## Step 5: Update CORS Configuration

Update the backend's CORS to accept your Vercel domain:

In Railway Variables, add:
```
CORS_ORIGINS=https://kisandirect.vercel.app
```

Or update `kisan-direct-ai/backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://kisandirect.vercel.app',
  ],
  credentials: true,
}));
```

---

## Step 6: Seed the Production Database

Option A: Run locally with production database:
```bash
cd kisan-direct-ai/backend
# Update .env with your Supabase DATABASE_URL
npm run db:push
npm run db:seed
```

Option B: Add a seed script to Railway:
1. In Railway, go to your backend service
2. Click **"Deploy"** → **"Redeploy"**
3. After deployment, go to **"Settings"** → **"Deploy"**
4. Add a custom start command:
   ```
   npx prisma db push && npx prisma db seed && node dist/server.js
   ```

---

## Step 7: Verify Deployment

1. Open your Vercel URL: `https://kisandirect.vercel.app`
2. Test the landing page loads
3. Click **"Demo Login"** and test each role
4. Verify maps load on the Demand Heatmap page
5. Test the marketplace and product listings
6. Check real-time notifications work

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-here` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://kisandirect.vercel.app` |
| `CORS_ORIGINS` | Extra CORS origins | `https://app.vercel.app` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://kisandirect-backend.up.railway.app` |

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Ensure DATABASE_URL is set correctly
- Verify Prisma schema is valid

### Frontend can't connect to backend
- Check VITE_API_URL is set correctly
- Verify CORS is configured
- Check browser console for errors

### Database connection fails
- Ensure Supabase project is active
- Check if IP is allowed (Supabase allows all by default)
- Verify connection string format

### Maps not loading
- MapLibre GL uses free tiles by default
- No API key required
- Check browser console for errors

---

## Post-Deployment Checklist

- [ ] Supabase database created and seeded
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS configured for Vercel domain
- [ ] All demo logins work
- [ ] Maps load correctly
- [ ] Real-time notifications work
- [ ] Mobile responsive
- [ ] All 23 languages work

---

## Free Tier Limitations

### Supabase Free Tier
- 500MB database storage
- 2GB bandwidth/month
- 60 concurrent connections
- Pauses after 7 days of inactivity

### Railway Free Tier
- $5 monthly credit
- 512MB RAM
- Shared CPU

### Vercel Free Tier
- 100GB bandwidth/month
- Serverless functions
- Automatic HTTPS

For an SIH demo, these free tiers are more than sufficient.

---

## Scaling for Production

If you need to scale beyond free tiers:

1. **Database**: Upgrade Supabase to Pro ($25/month)
2. **Backend**: Upgrade Railway to Developer ($20/month)
3. **Frontend**: Vercel Pro ($20/month) for more bandwidth
4. **Add Redis**: For caching and session management
5. **Add CDN**: Cloudflare for static assets

Total estimated cost for production: **$50-100/month**

---

## Support

For deployment issues:
1. Check the logs in Railway/Vercel dashboards
2. Review the [Supabase Documentation](https://supabase.com/docs)
3. Check [Railway Documentation](https://docs.railway.app)
4. Open an issue in the project repository
