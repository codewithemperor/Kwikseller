# KWIKSELLER - Vercel Hosting Guide

This guide walks you through deploying all Kwikseller apps to Vercel.

## Architecture Overview

Kwikseller is a **Turbo monorepo** with the following apps:

| App | Directory | Description | Port |
|-----|-----------|-------------|------|
| **Marketplace** | `apps/marketplace` | Customer-facing marketplace | 3000 |
| **Vendor** | `apps/vendor` | Vendor dashboard | 3001 |
| **Admin** | `apps/admin` | Admin panel | 3002 |
| **Rider** | `apps/rider` | Delivery rider app | 3003 |
| **API** | `apps/api` | NestJS backend (REST) | 4000 |

Shared packages are in `packages/` (ui, utils, types, etc.).

---

## Prerequisites

1. **Node.js** >= 18
2. **pnpm** >= 10.x (the project uses pnpm workspaces)
3. **Vercel CLI** (`npm i -g vercel`)
4. A **Vercel account** (free tier works)
5. The API backend deployed somewhere (Vercel, Railway, Render, etc.)

---

## Option A: Deploy Each App as a Separate Vercel Project (Recommended)

This is the easiest approach — each app gets its own Vercel project with its own domain/subdomain.

### Step 1: Deploy the Marketplace App

```bash
# Navigate to the marketplace app
cd apps/marketplace

# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel (follow the prompts)
vercel

# When prompted:
# - Project name: kwikseller-marketplace
# - Framework: Next.js (auto-detected)
# - Build command: pnpm run build (or leave default)
# - Output directory: leave default (.next)
```

After the first deploy, set up the **production environment variables** on the Vercel dashboard:

```bash
# Set environment variables on Vercel
vercel env add NEXT_PUBLIC_API_URL production
# Value: https://your-api-domain.com (your deployed API URL)

vercel env add API_URL production
# Value: https://your-api-domain.com

vercel env add NEXTAUTH_SECRET production
# Value: generate with: openssl rand -base64 32

vercel env add NEXTAUTH_URL production
# Value: https://kwikseller-marketplace.vercel.app

vercel env add DATABASE_URL production
# Value: your production database connection string
```

### Step 2: Deploy the Vendor App

```bash
cd apps/vendor

# Initialize as a separate Vercel project
vercel --yes

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
vercel env add API_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add DATABASE_URL production
```

### Step 3: Deploy the Admin App

```bash
cd apps/admin
vercel --yes
# Set same environment variables as above
```

### Step 4: Deploy the Rider App

```bash
cd apps/rider
vercel --yes
# Set same environment variables as above
```

### Step 5: Deploy the API (NestJS Backend)

The NestJS API requires a **Node.js server runtime** — Vercel supports this via serverless functions.

```bash
cd apps/api

# Deploy
vercel --yes

# Set environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add PORT production  # Value: 4000
```

> **Note:** For the NestJS API, consider deploying to **Railway**, **Render**, or **Fly.io** instead — they provide better support for long-running Node.js servers. If you do use Vercel, ensure your NestJS app is configured for serverless (each controller method is a separate function).

---

## Option B: Monorepo Single Deploy (Advanced)

If you prefer deploying the entire monorepo to a single Vercel project:

### Root `vercel.json` Configuration

Create a `vercel.json` in the project root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm turbo run build --filter=./apps/*",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": "apps/marketplace/.next"
}
```

> **Limitation:** Vercel's free tier only supports one framework per project. For multiple Next.js apps, use **Option A** (separate projects).

---

## Custom Domains Setup

After deploying, configure custom domains in the Vercel dashboard:

| App | Domain |
|-----|--------|
| Marketplace | `app.kwikseller.com` |
| Vendor | `vendor.kwikseller.com` |
| Admin | `admin.kwikseller.com` |
| Rider | `rider.kwikseller.com` |
| API | `api.kwikseller.com` |

### Steps:
1. Go to **Project Settings > Domains** in each Vercel project
2. Add the custom domain
3. Update your DNS provider to point the domain to Vercel:
   - **CNAME** record: `@` → `cname.vercel-dns.com`
   - **CNAME** record: `www` → `cname.vercel-dns.com`

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Public API URL (client-side) | Yes |
| `API_URL` | Server-side API URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Canonical URL of the app | Yes |
| `DATABASE_URL` | Prisma database connection string | Yes |
| `JWT_SECRET` | JWT token secret (API) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth (optional) | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) | No |
| `PAYSTACK_SECRET_KEY` | Paystack payment (optional) | No |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave payment (optional) | No |

---

## Vercel Project Settings

For each Next.js app, configure these settings in the Vercel dashboard:

### Build & Development Settings
- **Framework Preset:** Next.js
- **Build Command:** `pnpm run build`
- **Install Command:** `pnpm install`
- **Output Directory:** `.next`
- **Node.js Version:** 18.x or 20.x

### Root Directory
When using Option A (separate projects), set the **Root Directory** in Vercel project settings:
- For marketplace: `apps/marketplace`
- For vendor: `apps/vendor`
- For admin: `apps/admin`
- For rider: `apps/rider`
- For API: `apps/api`

> **Pro Tip:** You can use a **Vercel Mono Repo** setup by connecting the Git repo and setting the Root Directory for each project. Vercel will automatically detect changes in the correct directory.

---

## CI/CD with GitHub

Connect your GitHub repo to Vercel for automatic deployments:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `Kwikseller` GitHub repository
3. Configure the Root Directory (e.g., `apps/marketplace`)
4. Set environment variables
5. Deploy

Every push to `main` will trigger a production deployment. Pushes to other branches create preview deployments.

---

## Performance Optimization

### 1. Enable Edge Caching
Add to each app's `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... existing config
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
}
```

### 2. Image Optimization
Vercel automatically optimizes images. Ensure you use `next/image`:
```tsx
import Image from 'next/image'
<Image src="/icon.png" alt="Logo" width={32} height={32} />
```

### 3. Enable ISR (Incremental Static Regeneration)
For product pages, add revalidation:
```typescript
export const revalidate = 3600 // Revalidate every hour
```

---

## Troubleshooting

### Build Fails with "Module not found"
```bash
# Ensure pnpm is used for installs
vercel env add NODE_OPTIONS production
# Value: --max-old-space-size=4096
```

### API Rewrites Not Working in Production
In production, Next.js rewrites work differently. Update `next.config.ts`:
```typescript
async rewrites() {
  return [
    {
      source: "/api/v1/:path*",
      destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
    },
  ]
}
```

### Monorepo Workspace Dependencies Not Resolved
Create a `.npmrc` in the project root:
```
shamefully-hoist=true
public-hoist-pattern[]=@heroui/*
```

### Database Connection Issues
Use a connection pooler for production:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connect_timeout=15"
```

---

## Cost Estimate (Vercel Free Tier)

| Resource | Free Tier Limit | Notes |
|----------|----------------|-------|
| Bandwidth | 100 GB/month | Sufficient for MVP |
| Serverless Function Invocations | Unlimited | API routes |
| Build Minutes | 6000/month | ~100 builds |
| Edge Functions | 500K requests/month | |
| Domains | 1 custom domain | Additional domains need Pro |

For production, consider the **Vercel Pro plan** ($20/user/month) for:
- Unlimited bandwidth
- Custom domains (unlimited)
- Advanced analytics
- Password protection
