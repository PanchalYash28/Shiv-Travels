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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📧 EMAIL OTP ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

    // Create or update auth method
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 TOTP (GOOGLE AUTHENTICATOR) ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📱 Setup TOTP - Generate secret and QR code
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
    const { userId, totpToken, backupCodes } = req.body;

    if (!userId || !totpToken) {
      return res.status(400).json({ error: 'User ID and TOTP token required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let authMethod = await AuthMethod.findOne({ userId });
    if (!authMethod) {
      return res.status(400).json({ error: 'Start TOTP setup first' });
    }

    // Verify TOTP token (Note: secret should be stored temporarily during setup)
    // For now, we'll assume the secret is passed in the request for verification
    // In production, store the temporary secret in session or cache
    const verified = verifyTOTPToken(
      req.session?.totpSecret || 'temporary-secret',
      totpToken
    );

    if (!verified) {
      return res.status(400).json({ error: 'Invalid TOTP token' });
    }

    // Store TOTP secret
    authMethod.totpSecret = req.session?.totpSecret;
    authMethod.totpEnabled = true;
    authMethod.backupCodes = backupCodes || generateBackupCodes();
    authMethod.preferredMethod = 'totp-primary-email-backup';
    await authMethod.save();

    console.log(`✅ TOTP enabled for ${user.email}`);

    return res.json({
      ok: true,
      message:
        'TOTP successfully enabled. Save your backup codes in a safe place.',
      backupCodes: authMethod.backupCodes,
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 LOGIN ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 📧 Login with Email + Password (triggers Email OTP)
router.post('/login-with-email', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
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
        message: 'OTP sent to your email',
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

// ✅ Verify Login Email OTP
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
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 🔐 Login with TOTP (Google Authenticator)
router.post('/login-with-totp', async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;

    if (!email || !password || !totpToken) {
      return res
        .status(400)
        .json({
          error: 'Email, password, and TOTP token required',
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
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
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
