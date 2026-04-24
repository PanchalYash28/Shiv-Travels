# Frontend Testing Guide - Email OTP + Google Authenticator

## 🚀 Quick Start

Server must be running on `http://localhost:4000` with MongoDB connected.

```bash
cd backend
node server.js
```

## 📝 Test Scenarios

### Scenario 1: Create Account with Email OTP Only

**Steps:**
1. Navigate to `http://localhost:3000/create-account.html` (or open directly)
2. Fill in:
   - Email: `testuser@example.com`
   - Full Name: `Test User`
   - Phone: `+919876543210`
3. Click "📧 Send OTP"
4. Check your email (or console if using test email service)
5. Enter the 6-digit OTP
6. Enter password (minimum 6 characters): `Test@123`
7. Click "✅ Verify & Create Account"
8. On 2FA setup page, click "⏭️ Skip for Now"
9. Should redirect to home page with success message

**Expected:**
- ✅ Email OTP sent successfully
- ✅ Account created
- ✅ Redirected to home page

---

### Scenario 2: Create Account with Google Authenticator

**Steps:**
1. Start registration (same as Scenario 1, steps 1-7)
2. On 2FA setup page, click "🔐 Setup Google Authenticator"
3. You should see:
   - QR Code
   - Manual secret key
4. Open Google Authenticator app on phone
5. Tap "+" to add new authentication
6. Select "Scan a setup key"
7. Scan the QR code
8. Enter the 6-digit code shown in app
9. Click "✅ Verify & Enable 2FA"
10. You'll see backup codes - copy and save them
11. Click "✅ Finish Setup"
12. Should redirect to home page

**Expected:**
- ✅ QR code displays correctly
- ✅ Secret key is readable
- ✅ 6-digit code accepted
- ✅ Backup codes generated
- ✅ Successfully enabled 2FA

---

### Scenario 3: Login with Email OTP

**Setup:**
- Have an account created with email `testuser@example.com` and password `Test@123`
- 2FA is NOT enabled (skip option during registration)

**Steps:**
1. Navigate to login page
2. Enter:
   - Email: `testuser@example.com`
   - Password: `Test@123`
3. Click "🔓 Next"
4. You should see only "📧 Use Email OTP" button (no TOTP option)
5. Click "📧 Use Email OTP"
6. OTP will be sent to email
7. Enter 6-digit OTP
8. Click "✅ Login with OTP"
9. Should be logged in and redirected to home

**Expected:**
- ✅ Credentials accepted
- ✅ Only email OTP option shown (no Google Authenticator button)
- ✅ OTP received in email
- ✅ Successfully logged in

---

### Scenario 4: Login with Google Authenticator

**Setup:**
- Have an account created with Google Authenticator enabled
- 6-digit code available from authenticator app

**Steps:**
1. Navigate to login page
2. Enter email and password (same as account)
3. Click "🔓 Next"
4. You should see BOTH buttons:
   - "📧 Use Email OTP"
   - "🔐 Use Google Authenticator"
5. Click "🔐 Use Google Authenticator"
6. Get 6-digit code from Google Authenticator app
7. Enter the code in the input field
8. Click "✅ Login with Google Authenticator"
9. Should be logged in and redirected

**Expected:**
- ✅ Both auth methods available
- ✅ Code from authenticator app accepted
- ✅ Successfully logged in

---

### Scenario 5: Try Both Login Methods on Same Account

**Setup:**
- Account with Google Authenticator enabled

**Steps:**
1. Login page → Enter credentials
2. Try "📧 Use Email OTP" → Enter OTP → Login
3. Logout
4. Login page again → Enter credentials
5. Try "🔐 Use Google Authenticator" → Enter code → Login

**Expected:**
- ✅ Both methods work independently
- ✅ Can switch between methods

---

## 🧪 Error Cases to Test

### Invalid Email
- Input: `notanemail`
- Expected: Error message "❌ Please enter a valid email address"

### Missing Fields
- Try sending OTP without filling all fields
- Expected: Error message "❌ Please fill all fields (Email, Name, Phone)"

### Invalid OTP (Too Short)
- Input: `123` (only 3 digits)
- Expected: Error message "❌ OTP must be 6 digits"

### Invalid OTP (Wrong Code)
- Input: `000000`
- Expected: Error message "❌ Invalid OTP"

### Wrong Password
- Correct email, wrong password
- Expected: Error message "❌ Invalid credentials"

### Invalid 2FA Code
- Input: `000000` for TOTP
- Expected: Error message "❌ Invalid code"

### Short Password
- Input: `abc` (less than 6 chars)
- Expected: Error message "❌ Password must be at least 6 characters"

---

## 🎨 UI Verification

### Message Colors
- **Error** (Red): `❌ ...`
- **Success** (Green): `✅ ...` or `👋 ...`
- **Info** (Blue): `📧 ...` or other info messages

### Button Colors
- Primary (Blue): Login, Verify buttons
- Info (Cyan): Email OTP button (#17a2b8)
- Success (Green): Google Authenticator, Setup 2FA (#28a745)
- Secondary (Gray): Back, Skip buttons (#6c757d)

### Mobile Responsiveness
- Test on phone browser
- All inputs should be full width
- Buttons should be easily tappable
- Messages should be readable

---

## 📱 LocalStorage Verification

Open browser DevTools → Application → LocalStorage

**After Registration:**
```
authToken: "eyJhbGciOi..."
userId: "507f1f77bcf86cd799439011"
user: {"id": "...", "email": "...", "name": "..."}
```

**After Login:**
```
authToken: "eyJhbGciOi..."
user: {"id": "...", "email": "...", "name": "..."}
```

(TOTP-related keys should be cleared after 2FA setup)

---

## 🔍 Network Tab Testing

Open DevTools → Network tab and watch API calls:

**Registration Flow:**
1. `POST /api/auth/send-email-otp` → 200 with `{"ok": true, "message": "OTP sent..."}`
2. `POST /api/auth/verify-email-otp` → 200 with `{"ok": true, "token": "..."}`
3. `POST /api/auth/setup-totp` (if 2FA) → 200 with `{"ok": true, "secret": "...", "qrCode": "data:image/png..."}`
4. `POST /api/auth/verify-totp-setup` (if 2FA) → 200 with `{"ok": true, "backupCodes": [...]}`

**Login Flow:**
1. `POST /api/auth/login` → 200 with `{"ok": true, "requiresAuth": true, "totpEnabled": true/false}`
2. `POST /api/auth/send-login-otp` OR `POST /api/auth/verify-totp-login` → 200 with `{"ok": true, "token": "..."}`
3. or `POST /api/auth/verify-login-otp` → 200 with `{"ok": true, "token": "..."}`

---

## 🐛 Troubleshooting

### "Server error: Failed to fetch"
- Check backend is running
- Check CORS is enabled
- Check Network tab for failed requests

### "OTP sent but email never arrives"
- Check Gmail settings configured correctly
- Check email is in spam/promotions
- For testing: Check backend console output

### QR Code not displaying
- Check backend returned valid QR code data URL
- Try manual secret key entry instead
- Check localStorage has `totpQRCode` value

### Backup codes not showing
- Refresh page and check step2 div
- Check browser console for errors
- Ensure code was verified correctly first

### Can't login with TOTP
- Ensure time is synchronized on phone
- Check code hasn't expired (codes last ~30 seconds)
- Verify TOTP was properly saved in account

---

## 📊 Success Metrics

- [ ] All 5 scenarios pass
- [ ] All error cases handled
- [ ] UI displays correctly
- [ ] LocalStorage stores correct data
- [ ] Network requests show expected payloads
- [ ] Mobile responsive
- [ ] Redirects work properly
- [ ] Message colors correct
- [ ] Can't access pages without proper auth
