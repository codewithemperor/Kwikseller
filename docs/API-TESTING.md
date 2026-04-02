# API Testing Guide

> Complete guide to testing KWIKSELLER API endpoints using Swagger UI, Postman, and cURL.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Swagger UI Testing](#swagger-ui-testing)
3. [Postman Testing](#postman-testing)
4. [cURL Commands](#curl-commands)
5. [Testing Scenarios](#testing-scenarios)
6. [Common Issues](#common-issues)

---

## Quick Start

### Start the API Server

```bash
cd apps/api
bun run start:dev
```

### Verify Server is Running

```bash
curl http://localhost:4000/api/v1
```

Expected response:
```json
{
  "message": "KWIKSELLER API v1",
  "documentation": "/api/docs"
}
```

---

## Swagger UI Testing

### Accessing Swagger UI

```
URL: http://localhost:4000/api/docs
```

### Complete Testing Workflow

#### 1. Register a User

1. Find **POST /api/v1/auth/register**
2. Click **"Try it out"**
3. Enter request body:

```json
{
  "email": "testuser@example.com",
  "password": "TestPass123",
  "role": "BUYER",
  "firstName": "Test",
  "lastName": "User"
}
```

4. Click **"Execute"**

**Expected Response (201):**
```json
{
  "message": "Registration successful. Please check your email for the verification code.",
  "userId": "usr_xxx",
  "email": "testuser@example.com"
}
```

---

#### 2. Login

1. Find **POST /api/v1/auth/login**
2. Click **"Try it out"**
3. Enter request body:

```json
{
  "email": "testuser@example.com",
  "password": "TestPass123"
}
```

4. Click **"Execute"**

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "refreshExpiresIn": 604800,
  "user": {
    "id": "usr_xxx",
    "email": "testuser@example.com",
    "role": "BUYER",
    "status": "ACTIVE",
    "emailVerified": false,
    "profile": {
      "firstName": "Test",
      "lastName": "User"
    }
  }
}
```

**Copy the `accessToken` for the next step!**

---

#### 3. Authorize in Swagger

1. Click the **"Authorize"** button (🔓) at the top of the page
2. In the **Value** field, enter:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Replace with your actual token, keep the "Bearer " prefix)
3. Click **"Authorize"**
4. Click **"Close"**

---

#### 4. Test Protected Endpoints

##### Get Current User

1. Find **GET /api/v1/auth/me**
2. Click **"Try it out"**
3. Click **"Execute"**

**Expected Response (200):**
```json
{
  "id": "usr_xxx",
  "email": "testuser@example.com",
  "role": "BUYER",
  "status": "ACTIVE",
  "emailVerified": false,
  "profile": {
    "firstName": "Test",
    "lastName": "User"
  }
}
```

##### Change Password

1. Find **PATCH /api/v1/auth/change-password**
2. Click **"Try it out"**
3. Enter request body:

```json
{
  "currentPassword": "TestPass123",
  "newPassword": "NewTestPass456"
}
```

4. Click **"Execute"**

---

#### 5. Logout

1. Find **POST /api/v1/auth/logout**
2. Click **"Try it out"**
3. Optionally enter refresh token in body:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

4. Click **"Execute"**

---

## Postman Testing

### Import Collection

1. Open Postman
2. Click **Import** → **Raw text**
3. Paste the collection JSON from [AUTH-SYSTEM.md](./AUTH-SYSTEM.md#postman-collection)
4. Click **Import**

### Set Up Environment

1. Create a new environment: **KWIKSELLER Local**
2. Add variables:

| Variable | Initial Value |
|----------|---------------|
| `baseUrl` | `http://localhost:4000/api/v1` |
| `accessToken` | (leave empty) |
| `refreshToken` | (leave empty) |
| `testEmail` | `test@example.com` |
| `testPassword` | `TestPass123` |

### Run Requests in Order

1. **Register** → Creates new user
2. **Login** → Auto-saves tokens to variables
3. **Get Current User** → Uses saved access token
4. **Refresh Token** → Gets new tokens
5. **Logout** → Invalidates tokens

---

## cURL Commands

### Auth Endpoints

#### Register User

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "BUYER",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

#### Get Current User

```bash
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Verify Email

```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

#### Forgot Password

```bash
curl -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### Reset Password

```bash
curl -X POST http://localhost:4000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "NewPass123"
  }'
```

#### Refresh Token

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Logout

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Change Password

```bash
curl -X PATCH http://localhost:4000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass123",
    "newPassword": "NewPass456"
  }'
```

---

## Testing Scenarios

### Scenario 1: Complete User Registration Flow

```
1. POST /auth/register     → User created, OTP sent
2. POST /auth/verify-email → Email verified
3. POST /auth/login        → Get tokens
4. GET /auth/me            → Verify emailVerified = true
```

### Scenario 2: Password Reset Flow

```
1. POST /auth/forgot-password  → OTP sent
2. POST /auth/reset-password   → Password changed
3. POST /auth/login            → Login with new password
```

### Scenario 3: Token Refresh Flow

```
1. POST /auth/login         → Get tokens
2. Wait 15+ minutes         → Access token expires
3. GET /auth/me             → Returns 401
4. POST /auth/refresh       → Get new tokens
5. GET /auth/me             → Success with new token
```

### Scenario 4: Logout and Token Invalidation

```
1. POST /auth/login    → Get tokens
2. GET /auth/me        → Success
3. POST /auth/logout   → Tokens blacklisted
4. GET /auth/me        → Returns 401 (token revoked)
5. POST /auth/refresh  → Returns 401 (refresh token revoked)
```

### Scenario 5: VENDOR Registration with Store

```bash
# Register as vendor
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@example.com",
    "password": "VendorPass123",
    "role": "VENDOR",
    "firstName": "Jane",
    "lastName": "Store",
    "storeName": "Jane Fashion Store"
  }'

# Response includes store info
# Login and check /auth/me for store details
```

---

## Common Issues

### 1. CORS Errors

**Symptom:** Browser blocks requests

**Solution:**
- The API has CORS configured for localhost ports
- If using a different port, add it to the CORS origins in `main.ts`

### 2. 401 Unauthorized

**Symptom:** Protected endpoints return 401

**Check:**
- Token format: `Bearer <token>` (include "Bearer ")
- Token hasn't expired (15 minutes)
- Token not blacklisted (logout was called)

### 3. Validation Errors

**Symptom:** 400 Bad Request with validation details

**Check:**
- Email format is valid
- Password meets requirements (8+ chars, uppercase, lowercase, number)
- Required fields are included

### 4. Connection Refused

**Symptom:** Cannot connect to server

**Check:**
- Server is running: `bun run start:dev`
- Correct port (4000)
- No other process using the port

---

## Testing Checklist

### Auth Endpoints

- [ ] Register BUYER
- [ ] Register VENDOR
- [ ] Register RIDER
- [ ] Register ADMIN (requires invite token)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Get current user
- [ ] Change password
- [ ] Logout
- [ ] Refresh token
- [ ] Verify email with OTP
- [ ] Resend verification
- [ ] Forgot password
- [ ] Reset password with OTP

### Token Tests

- [ ] Access token expires after 15 min
- [ ] Refresh token works after access token expires
- [ ] Token blacklisted after logout
- [ ] Invalid token returns 401

### Role Tests

- [ ] BUYER cannot access VENDOR routes
- [ ] VENDOR can access store routes
- [ ] ADMIN can access admin routes
- [ ] RIDER can access delivery routes

---

## Related Documentation

- [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) - Complete authentication system guide
- [GMAIL-SMTP-SETUP.md](./GMAIL-SMTP-SETUP.md) - Email configuration

---

**Last Updated:** 2024
