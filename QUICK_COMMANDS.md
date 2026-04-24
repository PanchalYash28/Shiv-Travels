# 🎯 Quick Command Reference

## 🚀 Start Backend
```bash
cd d:\Shiv Travel Publish\Shiv Travels\shiv-travels\backend
node server.js
```

## 🧪 Test System
Open in browser:
```
file:///d:/Shiv Travel Publish/Shiv Travels/shiv-travels/frontend/mfa-testing.html
```

OR visit:
```
http://localhost:4000/mfa-testing.html
```

## 📋 API Base URL
```
http://localhost:4000/api/auth
```

## 📧 Email Used
```
Email: shivtravels75@gmail.com
Password: epve sjmk tslo ooip
```

## 🔑 Environment Variables
Located in: `backend/.env`

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/shiv_travels
JWT_SECRET=supersecretkey
EMAIL_SERVICE=gmail
EMAIL_FROM=shivtravels75@gmail.com
EMAIL_PASSWORD=epve sjmk tslo ooip
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

## 📱 Google Authenticator Setup
1. Download app (any of these):
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - 1Password

2. In app, tap "+"
3. Scan QR code OR manually enter secret
4. Get 6-digit code
5. Use for login

## 🔓 Login Options

### Option A: Email OTP
```
1. Enter email
2. Receive 6-digit OTP
3. Enter OTP
4. Done! ✅
```

### Option B: Google Authenticator
```
1. Enter email
2. Get 6-digit code from app
3. Enter code
4. Done! ✅
```

## 🆘 Reset Everything

### Clear OTP Cache (restart backend):
```bash
node server.js
```

### Clear Browser Storage:
```javascript
localStorage.clear()
```

### Delete Test User:
Open MongoDB client and:
```javascript
db.users.deleteOne({email: "testuser@example.com"})
db.authmethods.deleteOne({email: "testuser@example.com"})
```

## 📊 Test Data

### Example User 1
```
Email: test1@example.com
Phone: 9876543210
Name: Test User 1
Password: Test@12345
```

### Example User 2
```
Email: test2@example.com
Phone: 9988776655
Name: Test User 2
Password: Test@12345
```

## 🐛 Debug Logs

### Backend Console:
```
📧 Generated Email OTP for test@example.com: 123456
📱 TOTP secret generated for test@example.com
✅ TOTP enabled for test@example.com
✅ TOTP login successful for test@example.com
```

### Check Server Health:
```bash
curl http://localhost:4000/api/health
```

## 📞 Common Issues

### Email not sent?
- Check spam folder
- Verify email in .env
- Restart backend
- Check email credentials

### TOTP not working?
- Sync phone time
- Check secret matches app
- Try different authenticator app
- Check device time zone

### MongoDB error?
- Start MongoDB: `mongod`
- Check connection string in .env
- Verify database exists

### Port 4000 already in use?
- Find process: `netstat -ano | findstr :4000`
- Kill process: `taskkill /PID [PID] /F`
- Or change PORT in .env

## 📚 Documentation Files

- `SETUP_COMPLETE.md` - Full setup guide
- `TESTING_GUIDE.md` - API testing guide
- `QUICK_REFERENCE.md` - Developer reference
- `AUTHENTICATION_SETUP.md` - Detailed setup
- `AUTHENTICATION_SUMMARY.md` - System overview

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:4000
- [ ] MongoDB connected
- [ ] Email sending (check logs)
- [ ] Can register with Email OTP
- [ ] Can setup Google Authenticator
- [ ] Can login with Email OTP
- [ ] Can login with Google Authenticator
- [ ] JWT token generated
- [ ] User stored in database

## 🎯 Next Steps

1. **Frontend Integration:**
   - Update login page UI
   - Add method selection screen
   - Add settings page for 2FA

2. **Production Setup:**
   - Enable HTTPS
   - Setup email service
   - Configure rate limiting
   - Setup monitoring

3. **Security:**
   - Enable CORS for frontend domain
   - Add password strength validation
   - Add account lockout after failed attempts
   - Add email verification on signup

## 📞 Support Commands

```bash
# Check Node version
node --version

# Check npm packages
npm list speakeasy qrcode nodemailer

# Clear npm cache
npm cache clean --force

# Reinstall packages
rm -r node_modules
npm install

# Check MongoDB
mongo --version

# Test email
curl -X POST http://localhost:4000/api/auth/send-email-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"9876543210","name":"Test"}'
```

---

**Last Updated:** April 23, 2026  
**Status:** ✅ Ready to Use
