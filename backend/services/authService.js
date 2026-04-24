const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate TOTP Secret for Google Authenticator
function generateTOTPSecret(phone, email) {
  const secret = speakeasy.generateSecret({
    name: `Shiv Travels (${email})`,
    issuer: 'Shiv Travels',
    length: 32,
  });

  return {
    secret: secret.base32,
    secretFull: secret,
  };
}

// Verify TOTP token (from Google Authenticator)
function verifyTOTPToken(totpSecret, token) {
  try {
    const verified = speakeasy.totp.verify({
      secret: totpSecret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (past and future)
    });

    return verified;
  } catch (err) {
    console.error('❌ TOTP verification error:', err.message);
    return false;
  }
}

// Generate QR Code for TOTP Secret
async function generateQRCode(totpSecret) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(totpSecret.secretFull.otpauth_url);
    return qrCodeDataUrl;
  } catch (err) {
    console.error('❌ QR Code generation error:', err.message);
    return null;
  }
}

module.exports = {
  generateOTP,
  generateTOTPSecret,
  verifyTOTPToken,
  generateQRCode,
};
