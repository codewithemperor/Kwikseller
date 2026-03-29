# KWIKSELLER - Africa's Most Powerful Commerce Operating System

A comprehensive multi-tenant e-commerce platform built with Turborepo monorepo architecture, featuring separate frontends for different user roles and a powerful NestJS backend.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 9.0.0 (recommended package manager)
- **Bun** (optional, for faster installs)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kwikseller
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory (or `apps/api/.env`):
   ```env
   # Database
   DATABASE_URL="file:../../db/kwikseller.db"

   # JWT
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"

   # Cloudinary (File Storage)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Email (SMTP) - Optional
   SMTP_HOST="smtp.example.com"
   SMTP_PORT=587
   SMTP_USER="your-email@example.com"
   SMTP_PASS="your-password"

   # App URLs
   MARKETPLACE_URL="http://localhost:3000"
   VENDOR_URL="http://localhost:3001"
   ADMIN_URL="http://localhost:3002"
   RIDER_URL="http://localhost:3003"
   API_URL="http://localhost:4000"
   ```

4. **Initialize the database**
   ```bash
   cd apps/api
   pnpm db:push      # Push schema to database
   pnpm db:generate  # Generate Prisma client
   ```

5. **Start development servers**
   ```bash
   # From the root directory
   pnpm dev
   ```

   This starts all apps in development mode:
   - **Marketplace**: http://localhost:3000
   - **Vendor Dashboard**: http://localhost:3001
   - **Admin Dashboard**: http://localhost:3002
   - **Rider App**: http://localhost:3003
   - **API Backend**: http://localhost:4000

## 📁 Project Structure

```
kwikseller/
├── apps/                          # Application packages
│   ├── api/                       # NestJS Backend API (port 4000)
│   │   ├── prisma/                # Database schema & migrations
│   │   │   └── schema.prisma      # Complete Prisma schema
│   │   └── src/
│   │       ├── modules/           # Feature modules
│   │       │   ├── auth/          # Authentication module
│   │       │   │   ├── decorators/  # @Public, @Roles, @Permissions, @CurrentUser
│   │       │   │   ├── guards/      # JwtAuthGuard, RolesGuard, AdminPermissionsGuard
│   │       │   │   ├── strategies/  # JWT and Refresh token strategies
│   │       │   │   └── dto/         # Auth DTOs
│   │       │   └── users/         # Users module
│   │       │       ├── dto/         # Profile, Address, KYC DTOs
│   │       │       └── users.service.ts
│   │       ├── common/            # Shared utilities
│   │       │   ├── services/      # StorageService, EmailService, etc.
│   │       │   ├── decorators/    # Custom decorators
│   │       │   ├── filters/       # Exception filters
│   │       │   └── interceptors/  # Response interceptors
│   │       └── database/          # Prisma service
│   │
│   ├── marketplace/               # Customer-facing marketplace (port 3000)
│   ├── vendor/                    # Vendor/Seller dashboard (port 3001)
│   ├── admin/                     # Admin dashboard (port 3002)
│   └── rider/                     # Rider/Delivery app (port 3003)
│
├── packages/                      # Shared packages
│   ├── ui/                        # Shared UI components (@kwikseller/ui)
│   ├── api-client/                # API client (@kwikseller/api-client)
│   ├── types/                     # Shared TypeScript types (@kwikseller/types)
│   ├── utils/                     # Shared utilities (@kwikseller/utils)
│   ├── eslint-config/             # Shared ESLint config
│   └── typescript-config/         # Shared TypeScript config
│
├── db/                            # Database files (SQLite)
├── turbo.json                     # Turborepo configuration
├── pnpm-workspace.yaml            # pnpm workspace config
└── package.json                   # Root package.json
```

## 🏗️ Architecture

### Frontend Apps (Next.js 16)

| App | Port | Description | Users |
|-----|------|-------------|-------|
| **marketplace** | 3000 | E-commerce marketplace | Buyers/Customers |
| **vendor** | 3001 | Seller dashboard | Vendors/Merchants |
| **admin** | 3002 | Admin panel | Platform Admins |
| **rider** | 3003 | Delivery app | Delivery Riders |

### Backend API (NestJS)

The backend runs on port **4000** and includes:

| Module | Features |
|--------|----------|
| **Auth** | JWT auth, Register/Login, Password Reset, Email Verification, Role-based access |
| **Users** | Profile CRUD, Address management, KYC document upload |
| **Storage** | Cloudinary integration for file uploads (images, documents) |
| **Notifications** | In-app notifications with real-time support |

## 🛠️ Available Scripts

### Root Level

```bash
# Install all dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev:marketplace  # Marketplace on port 3000
pnpm dev:vendor       # Vendor dashboard on port 3001
pnpm dev:admin        # Admin dashboard on port 3002
pnpm dev:rider        # Rider app on port 3003
pnpm dev:api          # API backend on port 4000

# Build all apps
pnpm build

# Lint all apps
pnpm lint

# Type check all apps
pnpm check-types

# Format code
pnpm format
```

### API Backend (apps/api)

```bash
cd apps/api

# Development
pnpm dev              # Start with watch mode

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database (no migrations)
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio (GUI)
pnpm db:seed          # Seed database

# Build & Production
pnpm build            # Build for production
pnpm start:prod       # Start production server

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:cov         # With coverage
```

### Frontend Apps

```bash
cd apps/marketplace  # or vendor, admin, rider

# Development
pnpm dev             # Start dev server

# Build
pnpm build           # Build for production
pnpm start           # Start production server

# Quality
pnpm lint            # Run ESLint
pnpm check-types     # TypeScript type check
```

## 🗄️ Database Schema

The Prisma schema includes 40+ entities organized into:

- **User & Auth**: Users, Profiles, Addresses, KYC Documents
- **Store & Products**: Stores, Products, Variants, Images, Categories
- **Orders & Payments**: Orders, Order Items, Payments, Escrow, Wallet
- **Subscription & Credits**: Subscriptions, KwikCoins, Milestones, Referrals
- **Delivery**: Riders, Deliveries
- **Marketing**: Ad Campaigns, Impressions
- **System**: Notifications, Audit Logs, Email Logs

### Key Enums

```typescript
UserRole: BUYER | VENDOR | ADMIN | RIDER
UserStatus: ACTIVE | SUSPENDED | BANNED | PENDING
OrderStatus: PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
PaymentStatus: PENDING | PAID | FAILED | REFUNDED
KycStatus: PENDING | APPROVED | REJECTED
SubscriptionPlan: STARTER | GROWTH | PRO | SCALE
AdminRole: SUPER_ADMIN | FINANCE | VENDOR_SUPPORT | OPERATIONS | MARKETING | CONTENT
```

## 🔐 Authentication

### JWT Authentication

- **Access Tokens**: 15-minute expiry
- **Refresh Tokens**: 7-day expiry with rotation

### Role-Based Access Control (RBAC)

Four user roles with different permissions:
- **BUYER**: Customers who browse and purchase
- **VENDOR**: Sellers who manage stores and products
- **ADMIN**: Platform administrators
- **RIDER**: Delivery personnel

### API Guards & Decorators

```typescript
// Make endpoint public (no auth required)
@Public()
@Get('public-endpoint')
publicEndpoint() {}

// Require specific roles
@Roles(UserRole.ADMIN, UserRole.VENDOR)
@Get('protected')
protectedRoute() {}

// Require admin permissions
@Roles(UserRole.ADMIN)
@Permissions('vendors:kyc:review')
@Get('admin/kyc/pending')
getPendingKyc() {}

// Get current user
@Get('me')
getCurrentUser(@CurrentUser('id') userId: string) {}
```

## 📦 Storage Service (Cloudinary)

The `StorageService` provides file upload functionality:

```typescript
// Upload profile image (256x256 WebP)
await storageService.uploadProfileImage(file, userId);

// Upload KYC document
await storageService.uploadKycDocument(file, userId, 'PASSPORT');

// Upload store assets
await storageService.uploadStoreAsset(file, storeId, 'logo');
await storageService.uploadStoreAsset(file, storeId, 'banner');

// Upload product image
await storageService.uploadProductImage(file, storeId, productId, position);
```

## 🌍 Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - (placeholder URLs) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `REDIS_URL` | Redis connection URL | - |
| `SMTP_HOST` | Email SMTP host | - |
| `SMTP_PORT` | Email SMTP port | 587 |

## 📝 API Endpoints

### Auth Endpoints

```
POST   /auth/register           # Register new user
POST   /auth/login              # Login
POST   /auth/refresh            # Refresh tokens
POST   /auth/logout             # Logout
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password
POST   /auth/verify-email       # Verify email
POST   /auth/resend-verification # Resend verification email
PATCH  /auth/change-password    # Change password (authenticated)
```

### User Endpoints

```
GET    /users/me                # Get current user
PATCH  /users/me/profile        # Update profile
POST   /users/me/avatar         # Upload avatar
DELETE /users/me/avatar         # Delete avatar

GET    /users/me/addresses      # Get all addresses
POST   /users/me/addresses      # Create address
GET    /users/me/addresses/:id  # Get address
PATCH  /users/me/addresses/:id  # Update address
DELETE /users/me/addresses/:id  # Delete address
PATCH  /users/me/addresses/:id/default # Set default

GET    /users/me/kyc            # Get KYC documents
POST   /users/me/kyc            # Upload KYC document
GET    /users/me/kyc/:id        # Get KYC document

# Admin KYC endpoints
GET    /users/admin/kyc/pending  # Get pending KYC (Admin)
PATCH  /users/admin/kyc/:id/review # Review KYC (Admin)
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run e2e tests (API)
cd apps/api && pnpm test:e2e
```

## 📄 License

Private - All rights reserved

---

**KWIKSELLER** - Empowering African Commerce 🌍
