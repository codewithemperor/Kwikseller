# Gmail SMTP Setup Guide

> Complete guide to configuring Gmail SMTP for sending OTP emails in KWIKSELLER.

---

## Overview

KWIKSELLER uses Gmail SMTP to send:
- Email verification OTP codes
- Password reset OTP codes
- Order notifications
- Welcome emails

---

## Prerequisites

- A Gmail account
- 2-Factor Authentication (2FA) enabled on your Google Account

---

## Step-by-Step Setup

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. If not already enabled, follow the prompts to set up 2FA
4. Complete the setup with your preferred method (SMS, Authenticator app, etc.)

### Step 2: Generate App Password

1. Go to **Security** → **2-Step Verification** → **App passwords**
   - Direct link: https://myaccount.google.com/apppasswords

2. You may be asked to sign in again

3. Click **"Create"** or **"Select app"**

4. Configure the app password:
   - **App name:** `KWIKSELLER API`
   - Or manually select:
     - App: **Mail**
     - Device: **Other (Custom name)**
     - Name: `KWIKSELLER`

5. Click **"Generate"**

6. Google will show a 16-character password in this format:
   ```
   xxxx xxxx xxxx xxxx
   ```

7. **Important:** Copy this password immediately! You won't be able to see it again.

### Step 3: Configure KWIKSELLER

Add the credentials to your `.env` file:

```env
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxxxxxxxxxxxxxx    # 16-char password WITHOUT spaces
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASS=abcd_efgh_ijkl_mnop
```

---

## Configuration Options

### Option 1: Gmail SMTP (Recommended for Development)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="KWIKSELLER <your-email@gmail.com>"
```

### Option 2: SendGrid (Recommended for Production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="KWIKSELLER <noreply@yourdomain.com>"
```

### Option 3: Amazon SES

```env
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM="KWIKSELLER <noreply@yourdomain.com>"
```

---

## Testing Your Configuration

### Method 1: Using the API

1. Register a test user:
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

2. Check your email for the verification OTP

### Method 2: Using a Script

Create a test script:

```javascript
// test-email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test Email from KWIKSELLER',
  text: 'If you received this, your SMTP is working!'
}).then(() => {
  console.log('✅ Email sent successfully!');
}).catch((error) => {
  console.error('❌ Error:', error.message);
});
```

Run with:
```bash
node test-email.js
```

---

## Troubleshooting

### Error: "Invalid login"

**Cause:** App password is incorrect or not set up properly

**Solution:**
1. Verify 2FA is enabled
2. Generate a new app password
3. Copy the password without spaces

### Error: "Connection timeout"

**Cause:** Firewall or network blocking SMTP connection

**Solution:**
1. Check if port 587 is open
2. Try port 465 with `secure: true`
3. Check firewall rules

### Error: "Daily sending quota exceeded"

**Cause:** Gmail has a daily sending limit (~500 emails/day)

**Solution:**
- For production, use SendGrid or Amazon SES
- For development, this limit should be sufficient

### Error: "Must issue a STARTTLS command first"

**Cause:** TLS configuration issue

**Solution:**
```javascript
// Add to transporter config
tls: {
  ciphers: 'SSLv3'
}
```

---

## Security Best Practices

1. **Never commit App Passwords to git**
   - Always use `.env` files
   - Add `.env` to `.gitignore`

2. **Use App Passwords, not your main password**
   - App passwords can be revoked without changing your main password
   - Each app password is unique to one application

3. **Rotate App Passwords periodically**
   - Delete old app passwords
   - Generate new ones every few months

4. **For Production:**
   - Use a dedicated email service (SendGrid, SES, Mailgun)
   - Set up SPF, DKIM, and DMARC records
   - Use a custom domain for sending emails

---

## Gmail Limits

| Limit | Value |
|-------|-------|
| Daily sending limit | ~500 emails/day |
| Recipients per message | 100 |
| Maximum attachment size | 25 MB |

For production workloads exceeding these limits, use a dedicated email service.

---

## Related Documentation

- [AUTH-SYSTEM.md](./AUTH-SYSTEM.md) - Complete authentication system guide
- [API-TESTING.md](./API-TESTING.md) - API testing guide

---

**Last Updated:** 2024
