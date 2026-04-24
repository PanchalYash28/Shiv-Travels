const API_BASE = ((window.SHIV_CONFIG && window.SHIV_CONFIG.apiBase) || 'http://localhost:4000/api') + '/auth';
const msg = document.getElementById('msg');

// Store current email for use in verification steps
let currentEmail = null;
let currentPhone = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 1: Enter Email/Phone & Password
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const emailOrPhone = document.getElementById('emailOrPhone')?.value.trim();
  const password = document.getElementById('password')?.value.trim();

  if (!emailOrPhone || !password) {
    showMsg('❌ Please enter email/phone and password', 'error');
    return;
  }

  try {
    showMsg('🔍 Checking credentials...');
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password })
    });

    const data = await res.json();
    
    if (data.ok && !data.requiresAuth) {
      // ✅ Direct login successful! No OTP needed
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.isAdmin) {
        showMsg('👋 Welcome Admin!', 'success');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 1000);
      } else {
        showMsg('✅ Login successful!', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    } else if (data.ok && data.requiresAuth && data.requiresTotpOnly) {
      // User has TOTP enabled - ask for TOTP code only
      currentEmail = data.email;
      currentPhone = data.phone;
      
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = 'none';
      document.getElementById('step3Totp').style.display = 'block';
      
      showMsg('🔐 Enter your 6-digit Google Authenticator code', 'info');
    } else {
      showMsg('❌ ' + (data.error || 'Invalid credentials'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Back Button
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('backBtn')?.addEventListener('click', () => {
  document.getElementById('step1').style.display = 'block';
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3Email').style.display = 'none';
  document.getElementById('step3Totp').style.display = 'none';
  
  // Clear inputs
  const emailInput = document.getElementById('emailOrPhone');
  const passwordInput = document.getElementById('password');
  const otpInput = document.getElementById('emailOtp');
  const totpInput = document.getElementById('totpCode');
  
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  if (otpInput) otpInput.value = '';
  if (totpInput) totpInput.value = '';
  
  showMsg('');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 2A: Send Email OTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('sendEmailOtpBtn')?.addEventListener('click', async () => {
  try {
    showMsg('📧 Sending OTP to your email...');
    const res = await fetch(`${API_BASE}/send-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail })
    });

    const data = await res.json();
    if (data.ok) {
      // Hide method selection, show OTP input
      document.getElementById('step2').style.display = 'none';
      document.getElementById('step3Email').style.display = 'block';
      showMsg('✅ OTP sent! Check your email (expires in 10 minutes)', 'success');
    } else {
      showMsg('❌ ' + (data.error || 'Failed to send OTP'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 2B: Use Google Authenticator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('useTotpBtn')?.addEventListener('click', () => {
  // Hide method selection, show TOTP input
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3Totp').style.display = 'block';
  showMsg('🔐 Ready for Google Authenticator code', 'info');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 3A: Verify Email OTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('verifyEmailOtpBtn')?.addEventListener('click', async () => {
  const otp = document.getElementById('emailOtp')?.value.trim();

  if (!otp || otp.length !== 6) {
    showMsg('❌ Please enter a valid 6-digit OTP', 'error');
    return;
  }

  try {
    showMsg('✅ Verifying OTP...');
    const res = await fetch(`${API_BASE}/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otp })
    });

    const data = await res.json();
    if (data.ok && data.token) {
      // Save authentication data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.isAdmin) {
        showMsg('👋 Welcome Admin! Redirecting...');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 1000);
      } else {
        showMsg('👋 Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    } else {
      showMsg('❌ ' + (data.error || 'Invalid OTP'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 3B: Verify Google Authenticator Code
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('verifyTotpBtn')?.addEventListener('click', async () => {
  const totpToken = document.getElementById('totpCode')?.value.trim();

  if (!totpToken || totpToken.length !== 6) {
    showMsg('❌ Please enter a valid 6-digit code', 'error');
    return;
  }

  try {
    showMsg('🔐 Verifying Google Authenticator code...');
    const res = await fetch(`${API_BASE}/verify-totp-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, totpToken })
    });

    const data = await res.json();
    if (data.ok && data.token) {
      // Save authentication data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.isAdmin) {
        showMsg('👋 Welcome Admin! Redirecting...');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 1000);
      } else {
        showMsg('👋 Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    } else {
      showMsg('❌ ' + (data.error || 'Invalid code'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORGOT PASSWORD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'forgot-password.html';
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showMsg(text, type = 'info') {
  msg.textContent = text;
  msg.className = 'msg ' + type;
  msg.style.display = text ? 'block' : 'none';
}
