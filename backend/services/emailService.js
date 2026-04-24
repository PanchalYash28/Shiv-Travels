const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send OTP email
async function sendOTPEmail(email, otp, userName, type = 'registration') {
  try {
    let subject = 'Shiv Travels - Your One-Time Password (OTP)';
    let heading = 'Welcome to Shiv Travels!';
    let description = 'Your One-Time Password (OTP) for authentication is:';

    if (type === 'password reset') {
      subject = 'Shiv Travels - Password Reset OTP';
      heading = 'Password Reset Request';
      description = 'Your One-Time Password (OTP) for password reset is:';
    } else if (type === 'login') {
      subject = 'Shiv Travels - Login OTP';
      heading = 'Login to Shiv Travels';
      description = 'Your One-Time Password (OTP) for login is:';
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${heading}</h2>
          <p style="color: #666;">Hi ${userName},</p>
          <p style="color: #666;">${description}</p>
          
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p style="color: #666;">
            <strong>⏱️ This OTP will expire in 10 minutes.</strong>
          </p>
          
          <p style="color: #666;">
            <strong>🔒 Security Note:</strong> Never share this OTP with anyone. Shiv Travels staff will never ask for your OTP.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            If you didn't request this OTP, please ignore this email or contact support immediately.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            © 2024 Shiv Travels. All rights reserved.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Send TOTP setup email with QR code
async function sendTOTPSetupEmail(email, qrCodeDataUrl, secret, userName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Shiv Travels - Set up Two-Factor Authentication',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Enable Two-Factor Authentication</h2>
          <p style="color: #666;">Hi ${userName},</p>
          
          <p style="color: #666;">
            To secure your Shiv Travels account, please set up Two-Factor Authentication using an authenticator app.
          </p>
          
          <h3 style="color: #333;">📱 Step 1: Download an Authenticator App</h3>
          <p style="color: #666;">
            Choose one of these apps:
            <br/>• Google Authenticator
            <br/>• Microsoft Authenticator
            <br/>• Authy
            <br/>• LastPass Authenticator
          </p>
          
          <h3 style="color: #333;">📸 Step 2: Scan this QR Code</h3>
          <div style="text-align: center; margin: 20px 0;">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 10px;">
          </div>
          
          <h3 style="color: #333;">⌨️ Step 3: Manual Entry (if QR scan fails)</h3>
          <p style="color: #666;">
            Enter this code in your authenticator app:
            <br/>
            <strong style="font-family: monospace; background-color: #f0f0f0; padding: 5px 10px; border-radius: 3px;">
              ${secret}
            </strong>
          </p>
          
          <h3 style="color: #333;">🔒 Important</h3>
          <p style="color: #666;">
            <strong>Save your backup codes:</strong> After setup, you'll receive backup codes. Store them in a safe place.
            <br/>You'll need them if you lose access to your authenticator app.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2024 Shiv Travels. All rights reserved.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 TOTP setup email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOTPEmail,
  sendTOTPSetupEmail,
};
