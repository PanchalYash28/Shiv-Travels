const API_BASE = ((window.SHIV_CONFIG && window.SHIV_CONFIG.apiBase) || 'http://localhost:4000/api') + '/auth';
const msg = document.getElementById('msg');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 1: Send OTP to Email
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('sendOtp').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!email || !name || !phone) {
    showMsg('❌ Please fill all fields (Email, Name, Phone)', 'error');
    return;
  }

  // Basic email validation
  if (!email.includes('@')) {
    showMsg('❌ Please enter a valid email address', 'error');
    return;
  }

  try {
    showMsg('📧 Sending OTP to your email...');
    const res = await fetch(`${API_BASE}/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone })
    });

    const data = await res.json();
    if (data.ok) {
      showMsg('✅ OTP sent! Check your email (expires in 10 minutes)', 'success');
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = 'block';
    } else {
      showMsg('❌ ' + (data.error || 'Failed to send OTP'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 2: Verify OTP and Create Account
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('verifyOtp').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const otp = document.getElementById('otp').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!otp || !password) {
    showMsg('❌ Please enter OTP and password', 'error');
    return;
  }

  if (otp.length !== 6) {
    showMsg('❌ OTP must be 6 digits', 'error');
    return;
  }

  if (password.length < 6) {
    showMsg('❌ Password must be at least 6 characters', 'error');
    return;
  }

  try {
    showMsg('✅ Creating account...');
    const res = await fetch(`${API_BASE}/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone, otp, password })
    });

    const data = await res.json();
    if (data.ok && data.token) {
      // Save user data (auto-login)
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('user', JSON.stringify(data.user));

      showMsg('✅ Account created successfully! Setting up...', 'success');

      // Show 2FA setup option
      document.getElementById('step2').style.display = 'none';
      document.getElementById('step3').style.display = 'block';
    } else {
      showMsg('❌ ' + (data.error || 'Invalid OTP'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 3: Optional - Setup Google Authenticator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('setupTOTP').addEventListener('click', async () => {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    showMsg('❌ User ID not found. Please refresh and try again.', 'error');
    return;
  }

  try {
    showMsg('🔑 Generating Google Authenticator secret...');
    const res = await fetch(`${API_BASE}/setup-totp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (data.ok) {
      // Store TOTP data for verification
      localStorage.setItem('totpSecret', data.secret);
      localStorage.setItem('totpBackupCodes', JSON.stringify(data.backupCodes));
      localStorage.setItem('totpQRCode', data.qrCode);

      showMsg('✅ Secret generated! Opening setup page...', 'success');
      
      // Redirect to TOTP setup page (we'll create a dedicated page for this)
      setTimeout(() => {
        window.location.href = 'setup-2fa.html';
      }, 1000);
    } else {
      showMsg('❌ ' + (data.error || 'Failed to generate secret'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// Skip TOTP setup and go to home
document.getElementById('skipTOTP').addEventListener('click', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (user.isAdmin) {
    showMsg('👋 Welcome Admin! Redirecting...');
    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 1000);
  } else {
    showMsg('👋 Account created successfully! Redirecting...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showMsg(text, type = 'info') {
  msg.textContent = text;
  msg.className = 'msg ' + type;
  msg.style.display = 'block';
}
