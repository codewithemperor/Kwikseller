# KWIKSELLER Documentation

> Comprehensive documentation for the KWIKSELLER platform.

---

## 📚 Documentation Index

### Authentication

| Document | Description |
|----------|-------------|
| [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) | Complete authentication system guide including architecture, endpoints, flows, and token management |
| [GMAIL-SMTP-SETUP.md](./GMAIL-SMTP-SETUP.md) | Step-by-step Gmail SMTP configuration for sending OTP emails |
| [API-TESTING.md](./API-TESTING.md) | Complete guide to testing API endpoints using Swagger UI, Postman, and cURL |

### Coming Soon

| Document | Description |
|----------|-------------|
| `DATABASE-SCHEMA.md` | Database schema and relationships |
| `API-REFERENCE.md` | Complete API reference for all endpoints |
| `DEPLOYMENT.md` | Deployment guide for production |
| `VENDOR-GUIDE.md` | Vendor onboarding and store management |
| `ADMIN-GUIDE.md` | Admin panel usage guide |

---

## 🚀 Quick Links

### Getting Started

1. **Set up Gmail SMTP** → [GMAIL-SMTP-SETUP.md](./GMAIL-SMTP-SETUP.md)
2. **Understand Auth System** → [AUTH-SYSTEM.md](./AUTH-SYSTEM.md)
3. **Test the API** → [API-TESTING.md](./API-TESTING.md)

### API Access

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:4000/api/v1 | Main API endpoint |
| Swagger UI | http://localhost:4000/api/docs | Interactive API documentation |

### Frontend Apps

| App | Port | URL | Description |
|-----|------|-----|-------------|
| Marketplace | 3000 | http://localhost:3000 | Buyer-facing storefront |
| Vendor | 3001 | http://localhost:3001 | Vendor dashboard (login at root) |
| Admin | 3002 | http://localhost:3002 | Admin panel |
| Rider | 3003 | http://localhost:3003 | Rider delivery app |

---

## 🏗️ Project Structure

```
kwikseller/
├── apps/
│   ├── api/           # NestJS backend API
│   ├── marketplace/   # Buyer-facing Next.js app
│   ├── vendor/        # Vendor dashboard Next.js app
│   ├── admin/         # Admin panel Next.js app
│   └── rider/         # Rider app Next.js app
├── packages/
│   ├── ui/            # Shared UI components
│   ├── utils/         # Shared utilities (auth context, etc.)
│   ├── types/         # Shared TypeScript types
│   ├── api-client/    # Shared Axios client
│   ├── fonts/         # Custom fonts
│   └── eslint-config/ # Shared ESLint config
└── docs/              # Documentation
```

---

## 🔐 Authentication Overview

KWIKSELLER uses a **unified authentication system** with a single API for all user types:

```
┌─────────────────────────────────────────────────────┐
│              SINGLE AUTH API                         │
│              /api/v1/auth/*                          │
├─────────────────────────────────────────────────────┤
│  Supported Roles:                                    │
│  • BUYER      - Standard customers                   │
│  • VENDOR     - Business owners / Sellers            │
│  • ADMIN      - Platform administrators              │
│  • RIDER      - Delivery partners                    │
│  • SUPER_ADMIN - Super administrators                │
└─────────────────────────────────────────────────────┘
```

For detailed information, see [AUTH-SYSTEM.md](./AUTH-SYSTEM.md).

---

## 📱 App Routing Structure

### Vendor App Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Login page | ❌ No |
| `/dashboard` | Vendor dashboard | ✅ Yes (VENDOR role) |
| `/login` | Login page | ❌ No |
| `/register` | Registration page | ❌ No |
| `/forgot-password` | Password reset request | ❌ No |
| `/reset-password` | Password reset confirmation | ❌ No |

### Rider App Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | ❌ No |
| `/login` | Login page | ❌ No |
| `/register` | Registration page | ❌ No |

### Admin App Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | ❌ No |
| `/login` | Login page | ❌ No |

### Marketplace App Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Homepage/Storefront | ❌ No |
| `/login` | Login page | ❌ No |
| `/register` | Registration with role selector | ❌ No |
| `/forgot-password` | Password reset request | ❌ No |
| `/reset-password` | Password reset confirmation | ❌ No |

---

## 📧 Email Configuration

OTP emails require SMTP configuration. For Gmail:

1. Enable 2FA on your Google Account
2. Generate an App Password
3. Configure environment variables

See [GMAIL-SMTP-SETUP.md](./GMAIL-SMTP-SETUP.md) for detailed instructions.

---

## 🧪 Testing

### Swagger UI

1. Open http://localhost:4000/api/docs
2. Use **POST /auth/register** to create a user
3. Use **POST /auth/login** to get tokens
4. Click **Authorize** and enter `Bearer <accessToken>`
5. Test protected endpoints

See [API-TESTING.md](./API-TESTING.md) for complete testing guide.

---

## 🛠️ Development Commands

```bash
# Start all services
bun run dev

# Start specific app
bun run dev:marketplace
bun run dev:vendor
bun run dev:admin
bun run dev:rider
bun run dev:api

# Run linting
bun run lint

# Check types
bun run check-types
```

---

## 🔄 Recent Updates

### Authentication System
- ✅ Unified auth system with single API for all user types
- ✅ OTP-based email verification (6-digit code)
- ✅ OTP-based password reset
- ✅ JWT token management with refresh tokens
- ✅ Zustand-based client state management with localStorage persistence
- ✅ Role-based route protection (ProtectedRoute component)
- ✅ Guest route protection (GuestRoute component)

### Vendor App
- ✅ Login page shown directly at root route (`/`)
- ✅ Dashboard at `/dashboard` route with VENDOR role protection
- ✅ Registration with vendor-specific fields
- ✅ Password reset flow

### Shared Packages
- ✅ `@kwikseller/ui` - Shared UI components (inputs, OTP verification, etc.)
- ✅ `@kwikseller/utils` - Auth context, stores, HTTP client, utilities
- ✅ `@kwikseller/types` - Shared TypeScript types and schemas

---

## 📝 Contributing

When adding new features:

1. **Update relevant documentation**
2. **Add JSDoc comments** to new functions
3. **Update API documentation** if adding endpoints
4. **Test with Swagger UI** before submitting

---

**Last Updated:** January 2025
**Version:** 1.1.0
