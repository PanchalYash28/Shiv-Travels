# 🧪 Quick Testing Guide - New Login System

## 🎯 Test Checklist (5 minutes)

### ✅ Test 1: Login Without 2FA (Fastest)
**What:** Regular user should login instantly without OTP

```
1. Go to login.html
2. Enter email: (any existing user without 2FA)
3. Enter password: (their password)
4. Click "Next"
5. Expected: 
   ✅ No OTP step shown
   ✅ No TOTP step shown
   ✅ Redirected to home.html immediately
   ✅ localStorage has authToken
   ✅ Navigation shows "Profile" and "Logout"
```

---

### ✅ Test 2: Login With 2FA
**What:** User with 2FA should only see TOTP step

```
1. Go to login.html
2. Enter email: (user with 2FA enabled)
3. Enter password: (their password)
4. Click "Next"
5. Expected:
   ✅ Message says "Enter 6-digit Google Authenticator code"
   ✅ Email OTP button NOT shown
   ✅ Only TOTP input field visible
6. Open Google Authenticator app on phone
7. Get 6-digit code (changes every 30 seconds)
8. Enter code + click "Login"
9. Expected:
   ✅ Logged in successfully
   ✅ Redirected to home
```

---

### ✅ Test 3: View & Edit Profile
**What:** User should be able to view and edit profile

```
1. Login with any account
2. In header, click "Profile" link
3. Expected:
   ✅ Name field shows (editable)
   ✅ Email field shows (read-only, disabled)
   ✅ Phone field shows (read-only, disabled)
4. Edit name: "John" → "John Updated"
5. Click "Update Profile"
6. Expected:
   ✅ Message shows "Profile updated successfully"
   ✅ Name is updated in the form
   ✅ localStorage updated with new name
```

---

### ✅ Test 4: Change Password from Profile
**What:** User can change password from profile

```
1. Login + Go to Profile
2. In "New Password" field, enter: MyNewPassword123
3. Click "Update Profile"
4. Expected:
   ✅ Message shows "Profile updated successfully"
5. Logout by clicking "Logout" link
6. Try login with old password
7. Expected:
   ❌ Login fails with old password
8. Try login with new password
9. Expected:
   ✅ Login succeeds with new password
```

---

### ✅ Test 5: Navigation Updates (Logged Out)
**What:** When not logged in, should see Login/Signup

```
1. Clear localStorage (or open incognito window)
2. Go to home (index.html)
3. Look at header navigation
4. Expected:
   ✅ "Create Account" link visible
   ✅ "Login" link visible
   ✅ "Profile" link NOT visible
   ✅ "Logout" link NOT visible
   ✅ "Admin" link NOT visible
```

---

### ✅ Test 6: Navigation Updates (Logged In)
**What:** When logged in, should see Profile/Logout

```
1. Login with regular account
2. Go to home (index.html)
3. Look at header navigation
4. Expected:
   ✅ "Create Account" link NOT visible
   ✅ "Login" link NOT visible
   ✅ "Profile" link visible
   ✅ "Logout" link visible
   ✅ "Admin" link NOT visible (if not admin)
```

---

### ✅ Test 7: Admin Navigation
**What:** Admin should see admin dashboard link

```
1. Login with admin account
   Admin email: kamleshpanchal1674@gmail.com
2. Go to home (index.html)
3. Look at header navigation
4. Expected:
   ✅ "Admin" link visible
   ✅ Click "Admin" takes to admin-dashboard.html
```

---

### ✅ Test 8: Forgot Password Still Works
**What:** Forgot password should still use email OTP

```
1. Go to login.html
2. Click "Forgot Password?" link
3. Expected:
   ✅ Redirected to forgot-password.html
4. Enter email: (existing user's email)
5. Click "Send OTP"
6. Check email for OTP
7. Enter OTP + new password
8. Click "Reset"
9. Expected:
   ✅ Message shows "Password reset successfully"
10. Go back to login.html
11. Login with new password
12. Expected:
    ✅ Login succeeds with new password
```

---

### ✅ Test 9: Create Account Still Works
**What:** Account creation flow unchanged

```
1. Go to create-account.html
2. Fill in: Email, Name, Phone
3. Click "Send OTP"
4. Check email for OTP
5. Enter OTP + password + confirm password
6. Click "Verify & Create Account"
7. Expected:
   ✅ Account created
   ✅ Auto-logged in (no re-login needed)
   ✅ Optional 2FA setup page shown
```

---

## 🔍 Debug Checklist

### If login not working:

**Check 1: localStorage**
```javascript
// Open browser console (F12)
localStorage.getItem('authToken')  // Should return JWT token
localStorage.getItem('user')       // Should return user object
```

**Check 2: Backend running**
```bash
# In terminal, check backend is running
curl http://localhost:4000/api/auth/login
# Should return an error (since no data), not "connection refused"
```

**Check 3: Network tab**
```
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try login
4. Click on "login" request
5. Response should show:
   {
     "ok": true or false,
     "requiresAuth": true/false,
     "token": "..." (if ok and no 2FA)
   }
```

**Check 4: Console errors**
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try login
4. Should be no red errors
5. Check for 404 or connection errors
```

---

## 📊 Expected Behavior Summary

| Action | Before | After |
|--------|--------|-------|
| Regular login | 3 steps (password + OTP) | 1 step (instant) |
| 2FA login | 3 steps (password + choose + TOTP) | 2 steps (password + TOTP) |
| Profile page | Exists | Works better |
| Navigation | Always shows Login/Signup | Dynamic based on login |
| OTP usage | Every login | Only registration & forgot password |
| Speed | Slow | Fast ⚡ |

---

## 🚀 All Tests Pass = Ready to Deploy!

When all 9 tests pass ✅, the system is ready for production! 

**Test Time: ~5 minutes**  
**Difficulty: Easy**  

Go ahead and test! 🎉
