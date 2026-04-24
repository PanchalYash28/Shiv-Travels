const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthMethod = require('../models/AuthMethod');
const {
  generateOTP,
  generateTOTPSecret,
  verifyTOTPToken,
  generateQRCode,
} = require('../services/authService');
const {
  sendOTPEmail,
  sendTOTPSetupEmail,
} = require('../services/emailService');

// In-memory store for temporary OTP (will expire after 10 min)
const otpStore = new Map();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📧 EMAIL OTP ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📧 Send Email OTP for Registration/Login
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ error: 'Email and phone required' });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP temporarily
    otpStore.set(email, { otp, expiryTime, phone, name });

    console.log(`📧 Generated Email OTP for ${email}: ${otp}`);

    // Send email
    const emailResult = await sendOTPEmail(email, otp, name || 'User');

    if (emailResult.success) {
      return res.json({
        ok: true,
        message: 'OTP sent to your email',
        email: email,
      });
    } else {
      return res.status(500).json({
        error: 'Failed to send email',
        details: emailResult.error,
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp, phone, name, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const storedOTP = otpStore.get(email);

    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP not found. Request a new one.' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > storedOTP.expiryTime) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Create or update user
    let user = await User.findOne({ email });
    const formattedPhone = phone.startsWith('+91')
      ? phone
      : '+91' + phone;

    if (!user) {
      user = new User({
        email,
        phone: formattedPhone,
        name: name || storedOTP.name,
        isVerified: true,
      });

      if (password) {
        await user.setPassword(password);
      }

      if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email) {
        user.isAdmin = true;
      }

      await user.save();
    } else {
      user.isVerified = true;
      if (password) await user.setPassword(password);
      await user.save();
    }

    // Create or update auth method (Email OTP enabled by default)
    let authMethod = await AuthMethod.findOne({ userId: user._id });
    if (!authMethod) {
      authMethod = new AuthMethod({
        userId: user._id,
        phone: formattedPhone,
        email: email,
        preferredMethod: 'email',
        emailOTPEnabled: true,
      });
      await authMethod.save();
    }

    // Clear stored OTP
    otpStore.delete(email);

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
      message: 'Email verified successfully',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 TOTP (GOOGLE AUTHENTICATOR) ENDPOINTS (OPTIONAL)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📱 Setup TOTP - Generate secret and QR code (OPTIONAL)
router.post('/setup-totp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let authMethod = await AuthMethod.findOne({ userId });
    if (!authMethod) {
      authMethod = new AuthMethod({
        userId,
        phone: user.phone,
        email: user.email,
      });
    }

    // Generate TOTP secret
    const totpData = generateTOTPSecret(user.phone, user.email);

    // Generate QR code
    const qrCode = await generateQRCode(totpData.secretFull);

    console.log(`📱 TOTP secret generated for ${user.email}`);

    return res.json({
      ok: true,
      secret: totpData.secret,
      qrCode: qrCode,
      backupCodes: generateBackupCodes(),
      message:
        'Scan QR code with Google Authenticator and verify the code to enable 2FA',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Verify and Enable TOTP
router.post('/verify-totp-setup', async (req, res) => {
  try {
    const { userId, totpToken, secret, backupCodes } = req.body;

    if (!userId || !totpToken || !secret) {
      return res.status(400).json({ 
        error: 'User ID, TOTP token, and secret required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify TOTP token against the provided secret
    const verified = verifyTOTPToken(secret, totpToken);

    if (!verified) {
      return res.status(400).json({ error: 'Invalid TOTP token' });
    }

    // Store TOTP secret
    let authMethod = await AuthMethod.findOne({ userId });
    if (!authMethod) {
      authMethod = new AuthMethod({
        userId,
        phone: user.phone,
        email: user.email,
      });
    }

    authMethod.totpSecret = secret;
    authMethod.totpEnabled = true;
    authMethod.backupCodes = backupCodes || generateBackupCodes();
    authMethod.preferredMethod = 'totp-primary-email-backup';
    await authMethod.save();

    console.log(`✅ TOTP enabled for ${user.email}`);

    return res.json({
      ok: true,
      message:
        'Google Authenticator successfully enabled. Save your backup codes in a safe place.',
      backupCodes: authMethod.backupCodes,
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 🔓 Disable TOTP (optional - allow users to turn it off)
router.post('/disable-totp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const authMethod = await AuthMethod.findOne({ userId });
    if (!authMethod) {
      return res.status(400).json({ error: 'Auth method not found' });
    }

    authMethod.totpEnabled = false;
    authMethod.totpSecret = null;
    authMethod.backupCodes = [];
    authMethod.preferredMethod = 'email';
    await authMethod.save();

    return res.json({
      ok: true,
      message: 'Google Authenticator disabled',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 LOGIN ENDPOINTS (FLEXIBLE - CHOOSE METHOD)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 🔓 Check Authentication Status
// Returns if TOTP is enabled for this user
router.post('/check-auth', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const authMethod = await AuthMethod.findOne({ userId: user._id });
    const totpEnabled = authMethod?.totpEnabled || false;

    return res.json({
      ok: true,
      email,
      totpEnabled,
      message: totpEnabled
        ? 'User has Google Authenticator enabled. Can use TOTP or Email OTP.'
        : 'User uses Email OTP',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 📧 Generic Login Endpoint
// User enters email/phone + password
// If TOTP enabled: ask for TOTP code only
// If no TOTP: return JWT token directly (no OTP needed)
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/Phone and password required' });
    }

    // Find user by email or phone
    let user = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone },
        { phone: '+91' + emailOrPhone }
      ]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email/phone or password' });
    }

    // Validate password
    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email/phone or password' });
    }

    // Check if user is an admin (by email configuration)
    const adminEmail = process.env.ADMIN_EMAIL || 'kamleshpanchal1674@gmail.com';
    if (user.email === adminEmail || user.phone === adminEmail) {
      user.isAdmin = true;
      await user.save();
    }

    const authMethod = await AuthMethod.findOne({ userId: user._id });
    const totpEnabled = authMethod?.totpEnabled || false;

    // If TOTP is NOT enabled, login directly (no OTP needed)
    if (!totpEnabled) {
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        ok: true,
        token,
        requiresAuth: false,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
        },
        message: 'Login successful',
      });
    }

    // If TOTP is enabled, ask for TOTP code only (not email OTP)
    return res.json({
      ok: true,
      email: user.email,
      phone: user.phone,
      requiresAuth: true,
      totpEnabled: true,
      requiresTotpOnly: true,
      message: '🔐 Please verify with your Google Authenticator',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📧 EMAIL OTP LOGIN (OPTION 1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Send Email OTP for Login
router.post('/send-login-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Generate and send Email OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiryTime });

    console.log(`📧 Login OTP for ${email}: ${otp}`);

    const emailResult = await sendOTPEmail(email, otp, user.name);

    if (emailResult.success) {
      return res.json({
        ok: true,
        requiresOTP: true,
        message: '📧 OTP sent to your email',
        email: email,
      });
    } else {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Verify Email OTP for Login
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const storedOTP = otpStore.get(email);

    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > storedOTP.expiryTime) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    otpStore.delete(email);

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
      message: '✅ Logged in with Email OTP',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GOOGLE AUTHENTICATOR (TOTP) LOGIN (OPTION 2)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Login with TOTP (Google Authenticator)
router.post('/verify-totp-login', async (req, res) => {
  try {
    const { email, totpToken } = req.body;

    if (!email || !totpToken) {
      return res.status(400).json({
        error: 'Email and TOTP token required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const authMethod = await AuthMethod.findOne({ userId: user._id });
    if (!authMethod || !authMethod.totpEnabled || !authMethod.totpSecret) {
      return res.status(400).json({ error: 'TOTP not enabled for this user' });
    }

    // Verify TOTP token
    const verified = verifyTOTPToken(authMethod.totpSecret, totpToken);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid TOTP token' });
    }

    console.log(`✅ TOTP login successful for ${email}`);

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
      message: '✅ Logged in with Google Authenticator',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// � FORGOT PASSWORD ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Send Forgot Password OTP
router.post('/send-forgot-password-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email not found' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store with a prefix to distinguish from login OTP
    otpStore.set('forgot-' + email, { otp, expiryTime, email });

    console.log(`🔑 Forgot password OTP for ${email}: ${otp}`);

    // Send email
    const emailResult = await sendOTPEmail(email, otp, user.name, 'password reset');

    if (emailResult.success) {
      return res.json({
        ok: true,
        message: 'OTP sent to your email for password reset',
        email: email,
      });
    } else {
      return res.status(500).json({
        error: 'Failed to send email',
        details: emailResult.error,
      });
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Verify Forgot Password OTP and Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        error: 'Email, OTP, and new password required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Verify OTP
    const storedOTP = otpStore.get('forgot-' + email);

    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP not found. Request a new one.' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > storedOTP.expiryTime) {
      otpStore.delete('forgot-' + email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Set new password
    await user.setPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    // Clear OTP
    otpStore.delete('forgot-' + email);

    console.log(`✅ Password reset successfully for ${email}`);

    return res.json({
      ok: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// �🛠️ HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Generate 8 backup codes
function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

module.exports = router;
