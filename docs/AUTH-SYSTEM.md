# KWIKSELLER Authentication System

> Complete guide to understanding and testing the KWIKSELLER authentication system.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Roles](#user-roles)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [Swagger UI Testing Guide](#swagger-ui-testing-guide)
7. [Postman Collection](#postman-collection)
8. [Token Management](#token-management)
9. [Guards & Decorators](#guards--decorators)
10. [Environment Configuration](#environment-configuration)
11. [Troubleshooting](#troubleshooting)

---

## Overview

KWIKSELLER uses a **unified authentication system** that serves all user types through a single API. The system is built on:

- **JWT (JSON Web Tokens)** for stateless authentication
- **Role-based access control (RBAC)** for authorization
- **OTP (One-Time Password)** for email verification and password reset
- **Redis** for session management and token blacklisting

### Key Features

- ✅ Single auth API for all user types (BUYER, VENDOR, ADMIN, RIDER)
- ✅ OTP-based email verification (6-digit code)
- ✅ OTP-based password reset
- ✅ Access token + Refresh token pattern
- ✅ Token blacklisting on logout
- ✅ Session tracking with device fingerprinting
- ✅ Role-based route protection
- ✅ Permission-based access for admins

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Marketplace │    │   Vendor    │    │    Admin    │    │    Rider    │  │
│  │  (Port 3000)│    │ (Port 3001) │    │ (Port 3002) │    │ (Port 3003) │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┼──────────────────┼──────────────────┘          │
│                            │                  │                              │
│                            ▼                  ▼                              │
│                    ┌───────────────────────────────┐                         │
│                    │     Shared Auth Context       │                         │
│                    │    (@kwikseller/utils)        │                         │
│                    └───────────────┬───────────────┘                         │
│                                    │                                         │
│                                    ▼                                         │
│                    ┌───────────────────────────────┐                         │
│                    │         API Gateway           │                         │
│                    │      (Caddy/Proxy)            │                         │
│                    └───────────────┬───────────────┘                         │
│                                    │                                         │
│                                    ▼                                         │
│                    ┌───────────────────────────────┐                         │
│                    │      NestJS Auth API          │                         │
│                    │     /api/v1/auth/*            │                         │
│                    │         (Port 4000)           │                         │
│                    └───────────────┬───────────────┘                         │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                         │
│                    ▼                               ▼                         │
│            ┌─────────────┐                 ┌─────────────┐                   │
│            │   SQLite    │                 │    Redis    │                   │
│            │  (Database) │                 │  (Sessions) │                   │
│            └─────────────┘                 └─────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Single Auth API?

| Approach | Pros | Cons |
|----------|------|------|
| **Single Auth API** ✅ | Consistent auth flow, easier maintenance, shared tokens, centralized security | None significant |
| Separate Auth APIs | App-specific customization | Code duplication, token incompatibility, maintenance burden |

---

## User Roles

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      USER ROLES                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BUYER          Standard customer                           │
│  ├── Browse products                                        │
│  ├── Place orders                                           │
│  ├── Track deliveries                                       │
│  └── Earn KwikCoins                                         │
│                                                             │
│  VENDOR         Business owner / Seller                     │
│  ├── All BUYER permissions                                  │
│  ├── Create & manage store                                  │
│  ├── List products                                          │
│  ├── Process orders                                         │
│  ├── Access analytics                                       │
│  └── Manage subscriptions                                   │
│                                                             │
│  RIDER         Delivery partner                             │
│  ├── Accept delivery assignments                            │
│  ├── Update delivery status                                 │
│  ├── Track earnings                                         │
│  └── Manage availability                                    │
│                                                             │
│  ADMIN          Platform administrator                      │
│  ├── Manage all users                                       │
│  ├── Approve KYC documents                                  │
│  ├── Moderate products                                      │
│  ├── Handle disputes                                        │
│  ├── View analytics                                         │
│  └── Configure platform settings                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Role-Specific Data

When you call `/auth/me`, the response includes role-specific data:

#### BUYER Response
```json
{
  "id": "usr_xxx",
  "email": "buyer@example.com",
  "role": "BUYER",
  "status": "ACTIVE",
  "emailVerified": true,
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://..."
  }
}
```

#### VENDOR Response
```json
{
  "id": "usr_xxx",
  "email": "vendor@example.com",
  "role": "VENDOR",
  "status": "ACTIVE",
  "emailVerified": true,
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "store": {
    "id": "store_xxx",
    "name": "Jane's Fashion Store",
    "slug": "janes-fashion-store",
    "isVerified": true,
    "onboardingComplete": true
  },
  "subscription": {
    "plan": "GROWTH",
    "status": "ACTIVE",
    "productLimit": 50
  }
}
```

#### ADMIN Response
```json
{
  "id": "usr_xxx",
  "email": "admin@kwikseller.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "emailVerified": true,
  "profile": {
    "firstName": "Admin",
    "lastName": "User"
  },
  "permissions": [
    "users:read",
    "users:write",
    "vendors:kyc:review",
    "orders:read",
    "finance:read"
  ]
}
```

---

## API Endpoints

### Base URL
```
http://localhost:4000/api/v1
```

### Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login user |
| `POST` | `/auth/refresh` | ❌ | Refresh access token |
| `POST` | `/auth/logout` | ✅ | Logout user |
| `GET` | `/auth/me` | ✅ | Get current user |
| `POST` | `/auth/forgot-password` | ❌ | Request password reset |
| `POST` | `/auth/reset-password` | ❌ | Reset password with OTP |
| `POST` | `/auth/verify-email` | ❌ | Verify email with OTP |
| `POST` | `/auth/resend-verification` | ❌ | Resend verification OTP |
| `PATCH` | `/auth/change-password` | ✅ | Change password |
| `POST` | `/auth/validate` | ✅ | Validate JWT token |

---

### Detailed Endpoint Documentation

#### 1. Register User

**POST** `/auth/register`

Register a new user with specified role.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "BUYER",           // BUYER | VENDOR | ADMIN | RIDER
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678"  // Optional
}
```

**VENDOR Registration (additional fields):**
```json
{
  "email": "vendor@example.com",
  "password": "SecurePass123",
  "role": "VENDOR",
  "firstName": "Jane",
  "lastName": "Smith",
  "storeName": "Jane's Store",
  "storeCategory": "Fashion"
}
```

**RIDER Registration (additional fields):**
```json
{
  "email": "rider@example.com",
  "password": "SecurePass123",
  "role": "RIDER",
  "firstName": "Mike",
  "lastName": "Rider",
  "vehicleType": "BIKE",     // BIKE | CAR | TRUCK
  "plateNumber": "ABC-123XY"
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful. Please check your email for the verification code.",
  "userId": "usr_xxx",
  "email": "user@example.com"
}
```

**Error Responses:**
- `409 Conflict` - Email already exists
- `400 Bad Request` - Validation errors

---

#### 2. Login User

**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "refreshExpiresIn": 604800,
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "role": "BUYER",
    "status": "ACTIVE",
    "emailVerified": true,
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account banned/suspended

---

#### 3. Verify Email

**POST** `/auth/verify-email`

Verify email address with OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

---

#### 4. Forgot Password

**POST** `/auth/forgot-password`

Request password reset OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "If the email exists, a verification code has been sent",
  "email": "user@example.com"
}
```

---

#### 5. Reset Password

**POST** `/auth/reset-password`

Reset password using OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

#### 6. Get Current User

**GET** `/auth/me`

Get authenticated user's full profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "id": "usr_xxx",
  "email": "user@example.com",
  "role": "BUYER",
  "status": "ACTIVE",
  "emailVerified": true,
  "profile": { ... },
  "store": { ... },          // VENDOR only
  "subscription": { ... },   // VENDOR only
  "permissions": [ ... ]     // ADMIN only
}
```

---

#### 7. Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "refreshExpiresIn": 604800
}
```

---

#### 8. Logout

**POST** `/auth/logout`

Invalidate current session.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 9. Change Password

**PATCH** `/auth/change-password`

Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## Authentication Flow

### Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REGISTRATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐     POST /auth/register     ┌──────────────┐                  │
│  │  Client  │ ─────────────────────────►  │   API        │                  │
│  └──────────┘                             └──────┬───────┘                  │
│       │                                          │                          │
│       │                                          ▼                          │
│       │                                   ┌──────────────┐                  │
│       │                                   │ Check email  │                  │
│       │                                   │ exists?      │                  │
│       │                                   └──────┬───────┘                  │
│       │                                          │                          │
│       │                              ┌───────────┴───────────┐              │
│       │                              │                       │              │
│       │                              ▼                       ▼              │
│       │                       ┌──────────┐           ┌──────────┐          │
│       │                       │  YES     │           │   NO     │          │
│       │                       │ 409 Error│           │ Continue │          │
│       │                       └──────────┘           └────┬─────┘          │
│       │                                                   │                │
│       │                                                   ▼                │
│       │                                          ┌──────────────┐          │
│       │                                          │ Create User  │          │
│       │                                          │ + Profile    │          │
│       │                                          │ + Role Data  │          │
│       │                                          └──────┬───────┘          │
│       │                                                 │                  │
│       │                                                 ▼                  │
│       │                                          ┌──────────────┐          │
│       │                                          │ Generate OTP │          │
│       │                                          │ (6 digits)   │          │
│       │                                          └──────┬───────┘          │
│       │                                                 │                  │
│       │                                                 ▼                  │
│       │                                          ┌──────────────┐          │
│       │                                          │ Store in     │          │
│       │                                          │ Redis (10m)  │          │
│       │                                          └──────┬───────┘          │
│       │                                                 │                  │
│       │                                                 ▼                  │
│       │                                          ┌──────────────┐          │
│       │                                          │ Send Email   │          │
│       │                                          │ with OTP     │          │
│       │                                          └──────┬───────┘          │
│       │                                                 │                  │
│       │◄────────────────────────────────────────────────┘                  │
│       │  Response: { message, userId, email }                              │
│       │                                                                    │
│       │  ┌──────────────────────────────────────┐                          │
│       │  │ User enters OTP on frontend          │                          │
│       │  └─────────────────┬────────────────────┘                          │
│       │                    │                                                │
│       │                    ▼                                                │
│       │  POST /auth/verify-email { email, otp }                            │
│       │                    │                                                │
│       │                    ▼                                                │
│       │            ┌──────────────┐                                        │
│       │            │ Validate OTP │                                        │
│       │            │ from Redis   │                                        │
│       │            └──────┬───────┘                                        │
│       │                   │                                                 │
│       │          ┌────────┴────────┐                                       │
│       │          │                 │                                       │
│       │          ▼                 ▼                                       │
│       │    ┌──────────┐     ┌──────────┐                                  │
│       │    │ Invalid  │     │  Valid   │                                  │
│       │    │ 400 Error│     │ Mark     │                                  │
│       │    └──────────┘     │ verified │                                  │
│       │                     └────┬─────┘                                  │
│       │                          │                                        │
│       │◄─────────────────────────┘                                        │
│       │  Response: { message: "Email verified successfully" }              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LOGIN FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐     POST /auth/login          ┌──────────────┐               │
│  │  Client  │ ─────────────────────────►    │   API        │               │
│  │          │   { email, password }         │              │               │
│  └──────────┘                               └──────┬───────┘               │
│                                                    │                        │
│                                                    ▼                        │
│                                             ┌──────────────┐                │
│                                             │ Find user    │                │
│                                             │ by email     │                │
│                                             └──────┬───────┘                │
│                                                    │                        │
│                                           ┌────────┴────────┐               │
│                                           │                 │               │
│                                           ▼                 ▼               │
│                                    ┌──────────┐      ┌──────────┐          │
│                                    │ Not Found│      │  Found   │          │
│                                    │ 401 Error│      │          │          │
│                                    └──────────┘      └────┬─────┘          │
│                                                             │               │
│                                                             ▼               │
│                                                      ┌──────────────┐       │
│                                                      │ Verify       │       │
│                                                      │ password     │       │
│                                                      └──────┬───────┘       │
│                                                             │               │
│                                                    ┌────────┴────────┐      │
│                                                    │                 │      │
│                                                    ▼                 ▼      │
│                                             ┌──────────┐      ┌──────────┐ │
│                                             │ Invalid  │      │  Valid   │ │
│                                             │ 401 Error│      │          │ │
│                                             └──────────┘      └────┬─────┘ │
│                                                                     │       │
│                                                                     ▼       │
│                                                              ┌───────────┐ │
│                                                              │ Check     │ │
│                                                              │ status    │ │
│                                                              └─────┬─────┘ │
│                                                                    │       │
│                                              ┌─────────────────────┼─────┐ │
│                                              │                     │     │ │
│                                              ▼                     ▼     ▼ │
│                                       ┌──────────┐         ┌──────────┐  │
│                                       │ BANNED   │         │ ACTIVE/  │  │
│                                       │ 403 Error│         │ PENDING  │  │
│                                       └──────────┘         └────┬─────┘  │
│                                                                  │        │
│                                                                  ▼        │
│                                                           ┌───────────┐  │
│                                                           │ Generate  │  │
│                                                           │ JWT tokens│  │
│                                                           └─────┬─────┘  │
│                                                                  │        │
│                                                                  ▼        │
│                                                           ┌───────────┐  │
│                                                           │ Store     │  │
│                                                           │ session   │  │
│                                                           │ in Redis  │  │
│                                                           └─────┬─────┘  │
│                                                                  │        │
│  ┌──────────┐                                                    │        │
│  │  Client  │◄───────────────────────────────────────────────────┘        │
│  └──────────┘  Response: { accessToken, refreshToken, user }               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Swagger UI Testing Guide

### Accessing Swagger UI

```
URL: http://localhost:4000/api/docs
```

### Step-by-Step Testing

#### Step 1: Register a New User

1. Find **POST /api/v1/auth/register**
2. Click **"Try it out"**
3. Enter request body:

```json
{
  "email": "test@example.com",
  "password": "TestPass123",
  "role": "BUYER",
  "firstName": "Test",
  "lastName": "User"
}
```

4. Click **"Execute"**
5. Copy the `email` from the response

#### Step 2: Login

1. Find **POST /api/v1/auth/login**
2. Click **"Try it out"**
3. Enter request body:

```json
{
  "email": "test@example.com",
  "password": "TestPass123"
}
```

4. Click **"Execute"**
5. Copy the `accessToken` from the response

#### Step 3: Authorize in Swagger

1. Click the **🔒 Authorize** button at the top right
2. In the popup, enter:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Replace with your actual token)
3. Click **"Authorize"**
4. Click **"Close"**

#### Step 4: Test Protected Endpoints

1. Find **GET /api/v1/auth/me**
2. Click **"Try it out"**
3. Click **"Execute"**
4. You should see your user profile

#### Step 5: Test Other Endpoints

- **PATCH /auth/change-password** - Change your password
- **POST /auth/logout** - Logout and invalidate token
- **POST /auth/refresh** - Get new tokens using refresh token

---

## Postman Collection

### Import Instructions

1. Open Postman
2. Click **Import**
3. Paste this collection JSON:

```json
{
  "info": {
    "name": "KWIKSELLER Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000/api/v1"
    },
    {
      "key": "accessToken",
      "value": ""
    },
    {
      "key": "refreshToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"TestPass123\",\n  \"role\": \"BUYER\",\n  \"firstName\": \"Test\",\n  \"lastName\": \"User\"\n}"
            },
            "url": { "raw": "{{baseUrl}}/auth/register" }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.collectionVariables.set('accessToken', jsonData.accessToken);",
                  "pm.collectionVariables.set('refreshToken', jsonData.refreshToken);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"TestPass123\"\n}"
            },
            "url": { "raw": "{{baseUrl}}/auth/login" }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": { "raw": "{{baseUrl}}/auth/me" }
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
            },
            "url": { "raw": "{{baseUrl}}/auth/refresh" }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
            },
            "url": { "raw": "{{baseUrl}}/auth/logout" }
          }
        }
      ]
    }
  ]
}
```

---

## Token Management

### Token Structure

#### Access Token Payload
```json
{
  "sub": "usr_xxx",           // User ID
  "email": "user@example.com",
  "role": "BUYER",            // User role
  "sessionId": "sess_xxx",    // Session identifier
  "iat": 1699887600,          // Issued at
  "exp": 1699888500           // Expires at (15 min)
}
```

#### Refresh Token Payload
```json
{
  "sub": "usr_xxx",
  "email": "user@example.com",
  "role": "BUYER",
  "sessionId": "sess_xxx",
  "iat": 1699887600,
  "exp": 1700492400          // Expires at (7 days)
}
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TOKEN LIFECYCLE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Login                                                                       │
│    │                                                                         │
│    ▼                                                                         │
│  ┌─────────────────┐    15 minutes    ┌─────────────────┐                   │
│  │  Access Token   │ ──────────────► │    Expired      │                   │
│  └─────────────────┘                 └────────┬────────┘                   │
│         │                                     │                             │
│         │ Use for API calls                   │ Auto-refresh                │
│         ▼                                     ▼                             │
│  ┌─────────────────┐                 ┌─────────────────┐                   │
│  │   API Requests  │                 │ Refresh Token   │                   │
│  │ Authorization:  │                 │ (valid 7 days)  │                   │
│  │ Bearer <token>  │                 └────────┬────────┘                   │
│  └─────────────────┘                          │                             │
│                                               │ Use to get new tokens        │
│                                               ▼                             │
│                                       ┌─────────────────┐                   │
│                                       │ POST /auth/     │                   │
│                                       │ refresh         │                   │
│                                       └────────┬────────┘                   │
│                                                │                            │
│                                                ▼                            │
│                                       ┌─────────────────┐                   │
│                                       │ New Access +    │                   │
│                                       │ Refresh Tokens  │                   │
│                                       └─────────────────┘                   │
│                                                                             │
│  Logout                                                                      │
│    │                                                                         │
│    ▼                                                                         │
│  ┌─────────────────┐                                                         │
│  │ Blacklist both │                                                         │
│  │ tokens in Redis│                                                         │
│  └─────────────────┘                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Token Storage (Frontend)

```typescript
// Store tokens after login
localStorage.setItem('kwikseller_access_token', accessToken);
localStorage.setItem('kwikseller_refresh_token', refreshToken);

// Get token for API calls
const token = localStorage.getItem('kwikseller_access_token');

// Clear tokens on logout
localStorage.removeItem('kwikseller_access_token');
localStorage.removeItem('kwikseller_refresh_token');
```

---

## Guards & Decorators

### Available Decorators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@Public()` | Mark route as public | `@Public() @Post('login')` |
| `@Roles()` | Require specific roles | `@Roles('VENDOR') @Get('store')` |
| `@Permissions()` | Require specific permissions | `@Permissions('users:read')` |
| `@CurrentUser()` | Get current user from JWT | `@CurrentUser('id') userId: string` |

### Guard Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GUARD EXECUTION ORDER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. JwtAuthGuard                                                            │
│     └── Validates JWT token                                                │
│     └── Attaches user to request                                           │
│                                                                             │
│  2. RolesGuard                                                              │
│     └── Checks user.role matches @Roles() decorator                        │
│                                                                             │
│  3. AdminPermissionsGuard                                                   │
│     └── Checks user.permissions includes @Permissions() decorator          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Usage Examples

#### Public Route
```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) {
  // No authentication required
}
```

#### Authenticated Route (Any Role)
```typescript
@Get('me')
@ApiBearerAuth()
async getCurrentUser(@CurrentUser('id') userId: string) {
  // Any authenticated user can access
}
```

#### Role-Restricted Route
```typescript
@Roles('VENDOR')
@Get('store')
async getStore(@CurrentUser('id') userId: string) {
  // Only VENDOR role can access
}
```

#### Permission-Restricted Route
```typescript
@Roles('ADMIN')
@Permissions('users:read')
@Get('admin/users')
async getAllUsers() {
  // Only ADMIN with users:read permission
}
```

---

## Environment Configuration

### Required Environment Variables

```env
# ====================
# Authentication
# ====================
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-characters

# ====================
# Email (Gmail SMTP)
# ====================
# See docs/GMAIL-SMTP-SETUP.md for detailed instructions
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# ====================
# Frontend URLs
# ====================
FRONTEND_URL=http://localhost:3000
MARKETPLACE_URL=http://localhost:3000
VENDOR_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
RIDER_URL=http://localhost:3003
```

### Gmail SMTP Setup

For detailed instructions on setting up Gmail SMTP, see [GMAIL-SMTP-SETUP.md](./GMAIL-SMTP-SETUP.md).

**Quick Steps:**
1. Enable 2FA on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use the 16-character password as `SMTP_PASS`

---

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" on login

**Cause:** Wrong email or password

**Solution:**
- Verify email exists in database
- Check password is correct
- Ensure user status is not BANNED/SUSPENDED

#### 2. "Invalid or expired verification code"

**Cause:** OTP expired or already used

**Solution:**
- Request new OTP via `/auth/resend-verification`
- OTPs expire after 10 minutes

#### 3. "Token has been revoked"

**Cause:** Token blacklisted after logout

**Solution:**
- Login again to get new tokens

#### 4. "Unauthorized" on protected routes

**Cause:** Missing or invalid Authorization header

**Solution:**
- Ensure header format: `Authorization: Bearer <token>`
- Check token hasn't expired
- Verify token is not blacklisted

#### 5. Email not sending

**Cause:** SMTP configuration issue

**Solution:**
- Check SMTP credentials
- Verify App Password is correct (for Gmail)
- Check SMTP_HOST and SMTP_PORT

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Checking Redis

```bash
# Connect to Redis
redis-cli

# Check stored OTP
GET "email-verification:user@example.com"

# Check session
GET "session:session-id"

# Check blacklisted token
GET "blacklist:token-value"
```

---

## Appendix

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### OTP Details

- **Length:** 6 digits
- **Expiry:** 10 minutes
- **Storage:** Redis with key pattern `{type}:{email}`

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 requests | 1 minute |
| `/auth/register` | 3 requests | 1 hour |
| `/auth/forgot-password` | 3 requests | 1 hour |

---

**Last Updated:** 2024
**Version:** 1.0.0
