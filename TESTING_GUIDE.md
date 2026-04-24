# 🚀 Shiv Travels MFA System - Ready to Use!

## ✅ Setup Complete

- ✅ **Step 1**: npm packages installed (speakeasy, qrcode, nodemailer)
- ✅ **Step 2**: Gmail email configured (shivtravels75@gmail.com)
- ✅ **Step 3**: auth.js updated with new MFA endpoints
- ✅ **Step 4**: Backend server running on http://localhost:4000

---

## 🎯 Two Authentication Methods Available

### Option 1: 📧 Email OTP (Default)
- Simple, one-step process
- User provides email → Gets OTP → Verifies → Logged in

### Option 2: 🔐 Google Authenticator (Optional)
- Enhanced security
- User can optionally setup Google Authenticator
- Can use EITHER Google Authenticator OR Email OTP to login (not both required)

---

## 🧪 Testing the API Endpoints

### ➤ Test 1: Register with Email OTP

**Step 1: Send OTP to Email**
```bash
curl -X POST http://localhost:4000/api/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "phone": "9876543210",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "OTP sent to your email",
  "email": "testuser@example.com"
}
```

Check the email inbox at testuser@example.com for the OTP (6-digit code).

---

**Step 2: Verify OTP and Register**
```bash
curl -X POST http://localhost:4000/api/auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "123456",
    "phone": "9876543210",
    "name": "Test User",
    "password": "SecurePassword@123"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id-here",
    "name": "Test User",
    "email": "testuser@example.com",
    "phone": "+919876543210",
    "isAdmin": false
  },
  "message": "Email verified successfully"
}
```

✅ **User is now registered and logged in!**

---

### ➤ Test 2: Setup Google Authenticator (Optional)

**Step 1: Generate TOTP Secret & QR Code**
```bash
curl -X POST http://localhost:4000/api/auth/setup-totp \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-previous-response"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backupCodes": ["ABC12345", "DEF67890", "GHI11111", "JKL22222", "MNO33333", "PQR44444", "STU55555", "VWX66666"],
  "message": "Scan QR code with Google Authenticator and verify the code to enable 2FA"
}
```

**What to do:**
1. Download Google Authenticator on your phone (iOS or Android)
2. Open the app and tap "+"
3. Scan the QR code (or manually enter the secret: `JBSWY3DPEBLW64TMMQ======`)
4. Google Authenticator will show a 6-digit code that changes every 30 seconds
5. Copy that 6-digit code and use it in the next step
6. **Save the backup codes** in a safe place!

---

**Step 2: Verify TOTP and Enable**
```bash
curl -X POST http://localhost:4000/api/auth/verify-totp-setup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "totpToken": "123456",
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "backupCodes": ["ABC12345", "DEF67890", "GHI11111", "JKL22222", "MNO33333", "PQR44444", "STU55555", "VWX66666"]
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Google Authenticator successfully enabled. Save your backup codes in a safe place.",
  "backupCodes": ["ABC12345", "DEF67890", "GHI11111", "JKL22222", "MNO33333", "PQR44444", "STU55555", "VWX66666"]
}
```

✅ **Google Authenticator is now enabled!**

---

### ➤ Test 3: Login - Check Available Methods

**Check what authentication methods user has**
```bash
curl -X POST http://localhost:4000/api/auth/check-auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

**Response if only Email OTP:**
```json
{
  "ok": true,
  "email": "testuser@example.com",
  "totpEnabled": false,
  "message": "User uses Email OTP"
}
```

**Response if Google Authenticator enabled:**
```json
{
  "ok": true,
  "email": "testuser@example.com",
  "totpEnabled": true,
  "message": "User has Google Authenticator enabled. Can use TOTP or Email OTP."
}
```

---

### ➤ Test 4: Login with Email + Password

**Step 1: Send Login OTP**
```bash
curl -X POST http://localhost:4000/api/auth/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "requiresOTP": true,
  "message": "📧 OTP sent to your email",
  "email": "testuser@example.com"
}
```

---

**Step 2: Verify Email OTP and Login**
```bash
curl -X POST http://localhost:4000/api/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "otp": "654321"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id-here",
    "name": "Test User",
    "email": "testuser@example.com",
    "phone": "+919876543210",
    "isAdmin": false
  },
  "message": "✅ Logged in with Email OTP"
}
```

✅ **User is logged in!**

---

### ➤ Test 5: Login with Google Authenticator

**One-step login with TOTP (if enabled)**
```bash
curl -X POST http://localhost:4000/api/auth/verify-totp-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "totpToken": "789456"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id-here",
    "name": "Test User",
    "email": "testuser@example.com",
    "phone": "+919876543210",
    "isAdmin": false
  },
  "message": "✅ Logged in with Google Authenticator"
}
```

✅ **User is logged in with Google Authenticator!**

---

## 📋 All API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---|
| `/api/auth/send-email-otp` | POST | Send OTP to email | ❌ No |
| `/api/auth/verify-email-otp` | POST | Register with OTP | ❌ No |
| `/api/auth/setup-totp` | POST | Generate TOTP secret | ❌ No |
| `/api/auth/verify-totp-setup` | POST | Enable TOTP | ❌ No |
| `/api/auth/disable-totp` | POST | Disable TOTP | ❌ No |
| `/api/auth/check-auth` | POST | Check available methods | ❌ No |
| `/api/auth/login` | POST | Check login options | ❌ No |
| `/api/auth/send-login-otp` | POST | Send login OTP | ❌ No |
| `/api/auth/verify-login-otp` | POST | Verify login OTP | ❌ No |
| `/api/auth/verify-totp-login` | POST | Login with TOTP | ❌ No |

---

## 🎯 User Experience Flow

### First Time User - Registration:
```
1. Enter email, phone, name
2. Receive OTP email
3. Enter OTP
4. Set password
5. Account created ✅
6. (Optional) Setup Google Authenticator
```

### Existing User - Login Options:
```
Option A - Email OTP:
1. Email address
2. Receive OTP
3. Enter OTP
4. Logged in ✅

Option B - Google Authenticator:
1. Email address
2. Open Google Authenticator app
3. Get 6-digit code
4. Enter code
5. Logged in ✅
```

---

## ⚙️ Configuration

**Email Setup:** ✅ Configured
```
Service: Gmail
Email: shivtravels75@gmail.com
Password: epve sjmk tslo ooip
```

**Backend:**
- Running on: http://localhost:4000
- MongoDB: Connected ✅
- Rate Limiting: Enabled (20 requests per 10 minutes)

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not received | Check spam folder, verify email is correct |
| TOTP code invalid | Ensure phone time is synced, try within 30 sec window |
| "User not found" | Register first, then try login |
| 429 Too Many Requests | Wait 10 minutes, rate limit will reset |
| MongoDB error | Ensure MongoDB is running on localhost:27017 |

---

## 📱 Download Google Authenticator

Users should download one of these apps:
- **Google Authenticator** - Most popular, no backup
- **Microsoft Authenticator** - Good for Windows users
- **Authy** - Has cloud backup support
- **1Password** - Password manager + authenticator

---

## ✨ Features Summary

✅ Email OTP (6-digit, 10-min expiry)  
✅ Google Authenticator (30-sec validity, offline-capable)  
✅ 8 Backup Codes (single-use emergency access)  
✅ Flexible Authentication (choose method)  
✅ QR Code Setup (easy app scanning)  
✅ Secure Password Hashing  
✅ JWT Tokens (7-day expiry)  
✅ Rate Limiting (brute-force protection)  
✅ MongoDB Integration  

---

## 🎉 You're Ready!

The system is fully operational. Start testing with the examples above!

Questions? Check console logs for debugging info.
