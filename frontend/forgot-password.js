const API_BASE = ((window.SHIV_CONFIG && window.SHIV_CONFIG.apiBase) || 'http://localhost:4000/api') + '/auth';
const msg = document.getElementById('msg');

let currentEmail = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 1: Send OTP to Email
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('sendOtpBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();

  if (!email) {
    showMsg('❌ Please enter your email address', 'error');
    return;
  }

  if (!email.includes('@')) {
    showMsg('❌ Please enter a valid email address', 'error');
    return;
  }

  try {
    showMsg('📧 Sending OTP to your email...');
    const res = await fetch(`${API_BASE}/send-forgot-password-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (data.ok) {
      currentEmail = email;
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
// Back Button
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('backBtn')?.addEventListener('click', () => {
  document.getElementById('step1').style.display = 'block';
  document.getElementById('step2').style.display = 'none';
  currentEmail = null;
  showMsg('');
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 2: Verify OTP and Reset Password
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('resetPasswordBtn')?.addEventListener('click', async () => {
  const otp = document.getElementById('otp').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();

  if (!otp || !newPassword || !confirmPassword) {
    showMsg('❌ Please fill all fields', 'error');
    return;
  }

  if (otp.length !== 6) {
    showMsg('❌ OTP must be 6 digits', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showMsg('❌ Password must be at least 6 characters', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showMsg('❌ Passwords do not match', 'error');
    return;
  }

  try {
    showMsg('🔐 Resetting password...');
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentEmail,
        otp,
        newPassword
      })
    });

    const data = await res.json();
    if (data.ok) {
      showMsg('✅ Password reset successfully!', 'success');
      document.getElementById('step2').style.display = 'none';
      document.getElementById('step3').style.display = 'block';
    } else {
      showMsg('❌ ' + (data.error || 'Failed to reset password'), 'error');
    }
  } catch (err) {
    showMsg('❌ Server error: ' + err.message, 'error');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STEP 3: Success - Go to Login
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.getElementById('loginBtn')?.addEventListener('click', () => {
  window.location.href = 'login.html';
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function showMsg(text, type = 'info') {
  msg.textContent = text;
  msg.className = 'msg ' + type;
  msg.style.display = text ? 'block' : 'none';
}
