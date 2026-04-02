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

| App | Port | URL |
|-----|------|-----|
| Marketplace | 3000 | http://localhost:3000 |
| Vendor | 3001 | http://localhost:3001 |
| Admin | 3002 | http://localhost:3002 |
| Rider | 3003 | http://localhost:3003 |

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
│  • BUYER    - Standard customers                     │
│  • VENDOR   - Business owners / Sellers              │
│  • ADMIN    - Platform administrators                │
│  • RIDER    - Delivery partners                      │
└─────────────────────────────────────────────────────┘
```

For detailed information, see [AUTH-SYSTEM.md](./AUTH-SYSTEM.md).

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

## 📝 Contributing

When adding new features:

1. **Update relevant documentation**
2. **Add JSDoc comments** to new functions
3. **Update API documentation** if adding endpoints
4. **Test with Swagger UI** before submitting

---

**Last Updated:** 2024
**Version:** 1.0.0
