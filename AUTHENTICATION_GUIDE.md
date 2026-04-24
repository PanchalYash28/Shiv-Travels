# Complete Authentication System Guide - Shiv Travels

## 📋 Overview

The Shiv Travels authentication system now supports:
1. ✅ **Email/Phone-based Login** - Users can login with either email OR phone number
2. ✅ **Email OTP Verification** - Primary authentication method using one-time passwords
3. ✅ **Google Authenticator (TOTP)** - Optional two-factor authentication
4. ✅ **Forgot Password** - Password reset using email OTP
5. ✅ **Admin Email Login** - Admin can login with email (kamleshpanchal1674@gmail.com)

---

## 🔐 Google Authenticator (TOTP) - Complete Guide

### What is Google Authenticator?

Google Authenticator is a **two-factor authentication (2FA) app** that generates time-based one-time passwords (TOTP). It works WITHOUT internet connection after initial setup.

### How It Works (Technical)

```
┌─────────────────────────────────────────────────────────────┐
│  TOTP Algorithm                                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Secret Key: 32-character random string (encoded)         │
│ 2. Time Counter: Current Unix time / 30 seconds             │
│ 3. HMAC-SHA1: Hash(secret + time counter)                   │
│ 4. 6-Digit Code: Extract 6 digits from hash                 │
│ 5. Validity: Code changes every 30 seconds                  │
└─────────────────────────────────────────────────────────────┘
```

### Where Google Authenticator is Used

#### 1. **During Registration (Optional)**

```
User Registration Flow:
  ↓
Enter email → Send OTP → Verify OTP → Create account
  ↓
Optional: Setup Google Authenticator (2FA)
  ├─ Show QR Code
  ├─ Manual Secret Key Entry
  ├─ Verify 6-digit code from app
  └─ Generate & Show Backup Codes
```

**Files Involved:**
- Frontend: `create-account.html`, `create-account.js`, `setup-2fa.html`
- Backend: `/api/auth/setup-totp`, `/api/auth/verify-totp-setup`

#### 2. **During Login (If 2FA Enabled)**

```
User Login Flow:
  ↓
Enter email/phone + password
  ↓
Password verified ✓
  ↓
Choose Authentication Method:
  ├─ Option A: Use Email OTP (always available)
  │   └─ Send 6-digit code to email
  │
  └─ Option B: Use Google Authenticator (if enabled)
      └─ Get 6-digit code from app
```

**Files Involved:**
- Frontend: `login.html`, `login.js`
- Backend: `/api/auth/login`, `/api/auth/verify-totp-login`

---

## 🔑 How Users Use Google Authenticator

### Step-by-Step for End Users

#### **Initial Setup (Registration)**

1. **Complete Account Creation**
   - Enter email, name, phone
   - Verify email OTP
   - Set password
   - Account created ✓

2. **Setup Google Authenticator (Optional)**
   - Click "🔐 Setup Google Authenticator"
   - Redirected to setup page
   - See QR Code displayed

3. **Scan QR Code with Authenticator App**
   ```
   On Mobile Phone:
   - Download Google Authenticator app
     (iOS: App Store, Android: Google Play)
   - Open app → Click "+" 
   - Select "Scan a setup key"
   - Point camera at QR code on screen
   - Authenticator recognizes and saves
   ```

4. **Manual Entry (If QR Scan Fails)**
   ```
   Secret Key: JBSWY3DPEBLW64TMMQ======
   
   Steps:
   - In Authenticator app, select "Can't scan it?"
   - Select "Enter a setup key"
   - Enter account name: "Shiv Travels"
   - Paste secret key: JBSWY3DPEBLW64TMMQ======
   - Select "Time based" (not counter based)
   - Save
   ```

5. **Verify Setup**
   - App shows 6-digit code (changes every 30 sec)
   - Enter code on web form
   - Click "✅ Verify & Enable 2FA"

6. **Save Backup Codes**
   - 8 backup codes displayed (one-time use)
   - Copy and save in secure location
   - Each code bypasses authenticator if lost

#### **Login with Google Authenticator**

1. **Enter Email/Phone and Password**
   ```
   Email/Phone: kamleshpanchal1674@gmail.com
   Password: ••••••
   Click: 🔓 Next
   ```

2. **Choose Authentication Method**
   - Both buttons appear (Email OTP + Google Authenticator)
   - Click: "🔐 Use Google Authenticator"

3. **Get Code from Authenticator App**
   ```
   Open Google Authenticator app on phone
   Find "Shiv Travels" entry
   See 6-digit code with countdown timer
   Code expires in ~30 seconds (then new code appears)
   ```

4. **Enter Code to Login**
   ```
   Code: 123456
   Click: ✅ Login with Google Authenticator
   ```

5. **Successfully Logged In!**
   - Redirected to home page
   - Session active

---

## 📧 Email-Based Login (Default Method)

### How Email OTP Works

```
Login Flow:
  1. User enters email/phone + password
  2. System verifies password ✓
  3. System sends 6-digit OTP to email
  4. User checks email
  5. User enters OTP code
  6. System verifies OTP (10 min expiry)
  7. User logged in ✓
```

### Why Email OTP (Primary Method)?

- ✅ Works on all devices
- ✅ No app installation required
- ✅ Fallback if user loses authenticator
- ✅ Quick and simple
- ✅ No setup needed

---

## 🔄 Complete User Flows

### New User Registration

```
┌────────────────────────────────────────┐
│ 1. Click "Create Account"              │
├────────────────────────────────────────┤
│ 2. Enter:                              │
│    - Email: test@example.com           │
│    - Name: John Doe                    │
│    - Phone: +919876543210              │
│    - Send OTP button                   │
├────────────────────────────────────────┤
│ 3. Receive OTP email                   │
│    - Check email inbox                 │
│    - Copy 6-digit code                 │
├────────────────────────────────────────┤
│ 4. Verify & Create Account             │
│    - Enter OTP: 123456                 │
│    - Set password: SecurePass123       │
│    - Click button                      │
├────────────────────────────────────────┤
│ 5. Setup 2FA (Optional)                │
│    Option A: Skip → Go to home         │
│    Option B: Setup → See setup page    │
│      - Scan QR code with app           │
│      - Enter verification code         │
│      - Save backup codes               │
├────────────────────────────────────────┤
│ ✅ Account Created & Logged In!        │
│    (Auto-login after registration)     │
└────────────────────────────────────────┘
```

### Existing User Login

```
┌────────────────────────────────────────┐
│ 1. Go to Login Page                    │
├────────────────────────────────────────┤
│ 2. Enter Email/Phone & Password        │
│    Email/Phone: test@example.com       │
│    Password: SecurePass123             │
│    Click: Next                         │
├────────────────────────────────────────┤
│ 3. Choose Auth Method                  │
│    If 2FA Enabled:                     │
│    ├─ Email OTP button                 │
│    └─ Google Authenticator button      │
│                                        │
│    If 2FA Disabled:                    │
│    └─ Email OTP button (only option)   │
├────────────────────────────────────────┤
│ 4A. Email OTP Path                     │
│    - Send OTP → Check email            │
│    - Enter code → Login                │
│                                        │
│ 4B. Google Authenticator Path          │
│    - Open app → Get 6-digit code       │
│    - Enter code → Login                │
├────────────────────────────────────────┤
│ ✅ Successfully Logged In!             │
│    Redirected to home/dashboard        │
└────────────────────────────────────────┘
```

### Forgot Password Flow

```
┌────────────────────────────────────────┐
│ 1. Click "🔑 Forgot Password?"         │
├────────────────────────────────────────┤
│ 2. Enter Email Address                 │
│    Email: test@example.com             │
│    Click: Send OTP                     │
├────────────────────────────────────────┤
│ 3. Receive Password Reset Email        │
│    - Check inbox                       │
│    - Copy 6-digit OTP                  │
├────────────────────────────────────────┤
│ 4. Reset Password                      │
│    - Enter OTP: 123456                 │
│    - New Password: NewPass123          │
│    - Confirm: NewPass123               │
│    - Click: Reset Password             │
├────────────────────────────────────────┤
│ 5. Success Message                     │
│    "Password reset successfully"       │
│    Click: Go to Login                  │
├────────────────────────────────────────┤
│ 6. Login with New Password             │
│    - Email: test@example.com           │
│    - Password: NewPass123 (new)        │
│    - Continue normal login flow        │
├────────────────────────────────────────┤
│ ✅ Logged In with New Password!        │
└────────────────────────────────────────┘
```

---

## 🗄️ Database Changes

### User Model - Added Email Field

```javascript
{
  name: String,           // "John Doe"
  email: String,          // "test@example.com" (NEW - UNIQUE)
  phone: String,          // "+919876543210"
  passwordHash: String,   // Hashed password
  isVerified: Boolean,    // true if email verified
  isAdmin: Boolean,       // true if admin
  createdAt: Date,
  updatedAt: Date         // NEW
}
```

### AuthMethod Model (Already Exists)

```javascript
{
  userId: ObjectId,
  email: String,
  phone: String,
  emailOTPEnabled: Boolean,      // true (default)
  totpEnabled: Boolean,          // false (until enabled)
  totpSecret: String,            // Secret key if enabled
  backupCodes: [String],         // One-time codes
  preferredMethod: String        // 'email' or 'totp-primary-email-backup'
}
```

---

## 🔌 Backend API Endpoints

### Registration Endpoints

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|-----------|
| `/auth/send-email-otp` | POST | Send OTP for registration | email, phone, name |
| `/auth/verify-email-otp` | POST | Create account with verified OTP | email, otp, password |
| `/auth/setup-totp` | POST | Generate TOTP secret & QR | userId |
| `/auth/verify-totp-setup` | POST | Enable TOTP after verification | userId, totpToken, secret |

### Login Endpoints

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|-----------|
| `/auth/login` | POST | Verify email/phone + password | emailOrPhone, password |
| `/auth/send-login-otp` | POST | Send OTP for authentication | email |
| `/auth/verify-login-otp` | POST | Login with OTP | email, otp |
| `/auth/verify-totp-login` | POST | Login with TOTP | email, totpToken |

### Password Reset Endpoints

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|-----------|
| `/auth/send-forgot-password-otp` | POST | Send password reset OTP | email |
| `/auth/reset-password` | POST | Reset password with OTP | email, otp, newPassword |

---

## 👤 Admin Email Login

### How Admin Logs In

```
Admin Email: kamleshpanchal1674@gmail.com

Login Process:
1. Go to login page
2. Enter email: kamleshpanchal1674@gmail.com
3. Enter password: [admin password]
4. Click "Next"
5. System auto-detects as admin
6. Choose authentication method (Email OTP or 2FA if enabled)
7. Verify
8. Redirected to admin-dashboard.html
```

### Configuration

In `.env` file:
```
ADMIN_EMAIL=kamleshpanchal1674@gmail.com
ADMIN_PHONE=+919824926485
```

System checks both email and phone to determine admin status.

---

## 🛡️ Security Features

### Email OTP
- ✅ 6-digit code (1,000,000 combinations)
- ✅ Expires after 10 minutes
- ✅ Can't reuse expired codes
- ✅ Sent via secure Gmail SMTP

### Google Authenticator (TOTP)
- ✅ Time-synchronized (can't be replayed)
- ✅ Based on RFC 6238 standard
- ✅ HMAC-SHA1 hashing
- ✅ Codes expire every 30 seconds
- ✅ Backup codes for emergency access

### Password Security
- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ Minimum 6 characters required
- ✅ JWT tokens valid for 7 days
- ✅ Email verification required

---

## 📱 Supported Authenticator Apps

Users can use ANY of these apps for Google Authenticator:

1. **Google Authenticator** (Recommended)
   - Free
   - Available on iOS and Android
   - Official Google product

2. **Microsoft Authenticator**
   - Free
   - Built-in to Microsoft ecosystem
   - Available on iOS and Android

3. **Authy**
   - Free (with paid features)
   - Cloud backup available
   - Available on iOS and Android

4. **LastPass Authenticator**
   - Free
   - Part of LastPass ecosystem
   - Available on iOS and Android

5. **FreeOTP**
   - Free
   - Open source
   - Available on iOS and Android

---

## 🆘 Troubleshooting

### QR Code Not Scanning?
- Use manual secret key entry
- Ensure good lighting
- Try with a different phone

### Lost Authenticator App?
- Use one of 8 backup codes
- Each backup code can only be used once
- Contact admin for account recovery

### OTP Not Received?
- Check spam/promotions folder
- Resend OTP (old one becomes invalid)
- Check email address is correct

### Forgot Password?
- Use "Forgot Password" link on login page
- Verify email address
- Receive password reset OTP
- Set new password

### Still Can't Login?
- Contact support
- Provide email address
- Verify identity before resetting

---

## 📊 File Structure

### Frontend Files

```
frontend/
├── create-account.html          ← Registration page (email field)
├── create-account.js            ← Registration logic (auto-login)
├── login.html                   ← Login page (email/phone support)
├── login.js                     ← Login logic (flexible auth)
├── setup-2fa.html              ← Google Authenticator setup
├── forgot-password.html         ← Password reset page
├── forgot-password.js           ← Password reset logic
├── create-account.css           ← Enhanced styling
└── login.css                    ← Enhanced styling
```

### Backend Files

```
backend/
├── routes/
│   └── auth.js                 ← All auth endpoints (updated)
├── models/
│   ├── User.js                 ← Added email field
│   └── AuthMethod.js           ← Stores TOTP data
├── services/
│   ├── authService.js          ← TOTP utilities
│   ├── emailService.js         ← Email templates (updated)
│   └── whatsapp.js             ← WhatsApp service
└── .env                        ← Config (added ADMIN_EMAIL)
```

---

## ✅ Testing Checklist

- [ ] Register with email → receive OTP → create account
- [ ] Auto-login after registration works
- [ ] Can skip 2FA setup during registration
- [ ] Can setup Google Authenticator during registration
- [ ] Login with email + password
- [ ] Login with phone + password
- [ ] Login with Email OTP method
- [ ] Login with Google Authenticator (if 2FA enabled)
- [ ] Forgot password flow works
- [ ] Can reset password with OTP
- [ ] Admin email (kamleshpanchal1674@gmail.com) redirects to admin dashboard
- [ ] Error messages display correctly (red)
- [ ] Success messages display correctly (green)
- [ ] Works on mobile devices

---

## 📝 Summary of Changes

### What's New

1. ✅ **Email field added to User model**
2. ✅ **Email/Phone flexible login** - Users can use either
3. ✅ **Google Authenticator (TOTP)** - Optional 2FA method
4. ✅ **Forgot Password feature** - Email OTP based reset
5. ✅ **Auto-login after registration** - Seamless experience
6. ✅ **Admin email support** - Login with admin email
7. ✅ **Enhanced error messages** - Color-coded (red/green)
8. ✅ **Backup codes** - For authenticator recovery

### What's Updated

1. ✅ User model schema
2. ✅ Auth routes (login endpoint supports email/phone)
3. ✅ Email service (supports different OTP types)
4. ✅ Frontend pages (HTML + JS)
5. ✅ Environment configuration (.env)

### What Works Together

```
User Registration
    ↓
Auto-login to account
    ↓
Optional: Setup Google Authenticator
    ↓
User can now login with:
  • Email + Password + Email OTP
  • Email + Password + Google Authenticator
  • Phone + Password + Email OTP
  • Phone + Password + Google Authenticator
```

---

## 🚀 Ready to Use!

All features are implemented and ready. Start by:

1. ✅ Backend running on http://localhost:4000
2. ✅ MongoDB connected
3. ✅ Gmail configured
4. ✅ Test registration → setup 2FA → login with both methods
5. ✅ Test forgot password flow
6. ✅ Test admin email login

Enjoy secure authentication! 🔐
