# 🔐 OTP Authentication System - TOTP + Email OTP Setup Guide

## 📦 Step 1: Install Required Packages

```bash
npm install speakeasy qrcode nodemailer
```

## ⚙️ Step 2: Update .env Configuration

Add these variables to your `.env` file:

```env
# ━━━━ EMAIL CONFIGURATION ━━━━
EMAIL_SERVICE=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Alternative: SendGrid
# SENDGRID_API_KEY=your-sendgrid-api-key
# EMAIL_SERVICE=sendgrid
```

## 📧 Step 3: Setup Gmail for Email OTP

### Option A: Gmail with App Password (Recommended)

1. Go to: https://myaccount.google.com/
2. Click **Security** in left sidebar
3. Enable **2-Step Verification** (if not already enabled):
   - Click "2-Step Verification"
   - Follow the setup process
4. Go back to Security tab
5. Scroll down to **App passwords**
6. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your OS)
7. Copy the generated 16-character password
8. Use it as `EMAIL_PASSWORD` in .env

### Option B: Gmail Less Secure App Access

1. Go to: https://myaccount.google.com/u/0/security
2. Scroll down to **Less secure app access**
3. Turn it ON
4. Use your Gmail password as `EMAIL_PASSWORD`

### Option C: SendGrid (Free Tier Available)

1. Sign up at: https://sendgrid.com/
2. Create API key from dashboard
3. Add to .env:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key-here
```

## 📱 Step 4: Install Authenticator Apps on Device

Users should download one of these:
- **Google Authenticator** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android) - Supports backup
- **LastPass Authenticator** (iOS/Android)

## 🔄 Step 5: Update Server Files

### Replace `/routes/auth.js` with `/routes/auth-new.js`:

```bash
# Backup old auth.js
mv backend/routes/auth.js backend/routes/auth-old.js

# Rename new auth file
mv backend/routes/auth-new.js backend/routes/auth.js
```

### Update `server.js` to use the new routes:

Make sure this line exists:
```javascript
app.use('/api/auth', require('./routes/auth'));
```

## 📋 API Endpoints Available

### 📧 EMAIL OTP ENDPOINTS

#### 1. Send Email OTP (Register/Login)
```bash
POST /api/auth/send-email-otp

Body:
{
  "email": "user@example.com",
  "phone": "9664518669",
  "name": "John Doe"
}

Response:
{
  "ok": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

#### 2. Verify Email OTP
```bash
POST /api/auth/verify-email-otp

Body:
{
  "email": "user@example.com",
  "otp": "123456",
  "phone": "9664518669",
  "name": "John Doe",
  "password": "SecurePassword@123"
}

Response:
{
  "ok": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+919664518669",
    "isAdmin": false
  }
}
```

### 🔐 TOTP (Google Authenticator) ENDPOINTS

#### 3. Setup TOTP
```bash
POST /api/auth/setup-totp

Body:
{
  "userId": "user-id-from-jwt"
}

Response:
{
  "ok": true,
  "secret": "ABCDEFGHIJKLMNOP",  // Share with user
  "qrCode": "data:image/png;base64,...",  // Display to user
  "backupCodes": ["CODE1", "CODE2", ...],  // Save securely
  "message": "Scan QR code with Google Authenticator..."
}
```

#### 4. Verify and Enable TOTP
```bash
POST /api/auth/verify-totp-setup

Body:
{
  "userId": "user-id",
  "totpToken": "123456",  // From Google Authenticator
  "backupCodes": ["CODE1", "CODE2", ...]
}

Response:
{
  "ok": true,
  "message": "TOTP successfully enabled",
  "backupCodes": ["CODE1", "CODE2", ...]
}
```

### 🔓 LOGIN ENDPOINTS

#### 5. Login with Email + Password
```bash
POST /api/auth/login-with-email

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword@123"
}

Response:
{
  "ok": true,
  "requiresOTP": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

#### 6. Verify Login OTP
```bash
POST /api/auth/verify-login-otp

Body:
{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "ok": true,
  "token": "jwt-token-here",
  "user": { ... }
}
```

#### 7. Login with TOTP
```bash
POST /api/auth/login-with-totp

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword@123",
  "totpToken": "123456"  // From Google Authenticator
}

Response:
{
  "ok": true,
  "token": "jwt-token-here",
  "user": { ... }
}
```

## 🧪 Testing the System

### Test 1: Register with Email OTP
```bash
curl -X POST http://localhost:4000/api/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "9664518669",
    "name": "Test User"
  }'

# Check email for OTP, then verify:

curl -X POST http://localhost:4000/api/auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "phone": "9664518669",
    "name": "Test User",
    "password": "TestPassword@123"
  }'
```

### Test 2: Setup Google Authenticator
```bash
curl -X POST http://localhost:4000/api/auth/setup-totp \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-jwt"
  }'

# Get QR code and secret, scan with Google Authenticator
# Then verify the setup with the 6-digit code
```

### Test 3: Login with TOTP
```bash
curl -X POST http://localhost:4000/api/auth/login-with-totp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "TestPassword@123",
    "totpToken": "123456"  # From Google Authenticator
  }'
```

## 📊 Authentication Methods Comparison

| Feature | Email OTP | TOTP (GA) | Combined |
|---------|-----------|-----------|----------|
| **Setup Time** | Instant | 1-2 min | 2-3 min |
| **Speed** | ⏱️ 10 min valid | ⚡ 30 sec per code | ⚡ Best |
| **Offline Use** | ❌ Requires internet | ✅ Works offline | ✅ Yes |
| **Recovery** | Email recovery | Backup codes | Both |
| **Security** | 🔒 Medium | 🔐 High | 🔐🔐 Very High |
| **User Experience** | Simple | More complex | Balanced |

## 🔄 Recommended Flow for Your App

### Registration:
1. User enters email, phone, password
2. Send Email OTP
3. User verifies Email OTP → Account created
4. Offer option to setup TOTP (Google Authenticator) for extra security

### Login:
1. User enters email + password
2. Check if TOTP is enabled:
   - **If YES**: Ask for TOTP token from Google Authenticator
   - **If NO**: Send Email OTP, verify, and login

### Security Best Practice:
- **Combined Mode**: TOTP as primary, Email OTP as backup
- Generate 8 backup codes during TOTP setup
- Store backup codes securely (local device, printed, etc.)

## ✅ What's Included

✅ Email OTP generation and verification  
✅ TOTP secret generation for Google Authenticator  
✅ QR code generation for easy scanning  
✅ Backup codes for account recovery  
✅ Multiple login methods  
✅ MongoDB integration for storing auth methods  
✅ JWT token generation  
✅ Secure password hashing with bcryptjs  

## 🚀 Next Steps

1. Install packages: `npm install speakeasy qrcode nodemailer`
2. Update `.env` with email configuration
3. Copy new model and service files
4. Update auth routes
5. Test the endpoints with curl or Postman
6. Update frontend to support new endpoints

## 📝 Notes

- Email OTPs expire after 10 minutes
- TOTP tokens are valid for 2 time steps (~60 seconds)
- Backup codes are single-use only
- Store backup codes securely by user
- Consider rate limiting on OTP requests to prevent brute force

---

Need help? Check the console logs for debugging!
