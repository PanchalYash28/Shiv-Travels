const mongoose = require('mongoose');

const authMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  // TOTP (Google Authenticator)
  totpSecret: {
    type: String,
    default: null,
  },
  totpEnabled: {
    type: Boolean,
    default: false,
  },
  // Email OTP
  emailOTPEnabled: {
    type: Boolean,
    default: true, // Enabled by default as backup
  },
  // Backup codes for TOTP
  backupCodes: {
    type: [String],
    default: [],
  },
  // Current email OTP (for verification)
  currentEmailOTP: {
    type: String,
    default: null,
  },
  emailOTPExpiry: {
    type: Date,
    default: null,
  },
  // 2FA preference
  preferredMethod: {
    type: String,
    enum: ['totp', 'email', 'totp-primary-email-backup'],
    default: 'email',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

authMethodSchema.index({ userId: 1 });
authMethodSchema.index({ phone: 1 });
authMethodSchema.index({ email: 1 });

module.exports = mongoose.model('AuthMethod', authMethodSchema);
