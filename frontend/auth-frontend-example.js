// 📧 Frontend Example: Email OTP Registration & Login
// Use these in your HTML pages with Fetch API

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API_BASE = 'http://localhost:4000/api/auth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📧 EMAIL OTP REGISTRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function registerWithEmailOTP() {
  try {
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const name = document.getElementById('name').value;

    // Step 1: Send OTP to email
    const response = await fetch(`${API_BASE}/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, name }),
    });

    const data = await response.json();

    if (data.ok) {
      alert('✅ OTP sent to your email!');
      showOTPVerificationForm(email, phone, name);
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error sending OTP');
  }
}

async function verifyEmailOTP() {
  try {
    const email = document.getElementById('otpEmail').value;
    const otp = document.getElementById('otpCode').value;
    const phone = document.getElementById('otpPhone').value;
    const name = document.getElementById('otpName').value;
    const password = document.getElementById('newPassword').value;

    // Step 2: Verify OTP and register
    const response = await fetch(`${API_BASE}/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp,
        phone,
        name,
        password,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      // Save JWT token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      alert('✅ Registration successful!');
      window.location.href = '/dashboard.html'; // Redirect to dashboard

      // Optionally offer TOTP setup
      offerTOTPSetup(data.user.id);
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error verifying OTP');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 GOOGLE AUTHENTICATOR (TOTP) SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function setupGoogleAuthenticator() {
  try {
    const userId = localStorage.getItem('userId');

    // Get QR code and secret
    const response = await fetch(`${API_BASE}/setup-totp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (data.ok) {
      // Display QR code
      document.getElementById('qrCode').innerHTML =
        `<img src="${data.qrCode}" alt="QR Code" />`;

      // Show secret for manual entry
      document.getElementById('secret').textContent = data.secret;

      // Show backup codes
      document.getElementById('backupCodes').textContent = data.backupCodes
        .join('\n');

      // Show verification form
      document.getElementById('totpVerificationForm').style.display = 'block';
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error setting up Google Authenticator');
  }
}

async function verifyTOTPSetup() {
  try {
    const userId = localStorage.getItem('userId');
    const totpToken = document.getElementById('totpToken').value;

    // Verify TOTP token
    const response = await fetch(`${API_BASE}/verify-totp-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        totpToken,
        backupCodes: JSON.parse(
          document.getElementById('backupCodes').textContent
        ),
      }),
    });

    const data = await response.json();

    if (data.ok) {
      alert('✅ Google Authenticator enabled!');
      alert(
        '⚠️ Save these backup codes in a safe place:\n\n' +
        data.backupCodes.join('\n')
      );
      document.getElementById('totpSetup').style.display = 'none';
    } else {
      alert('❌ Invalid code. Try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error verifying TOTP');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 LOGIN WITH EMAIL OTP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loginWithEmail() {
  try {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Step 1: Send OTP
    const response = await fetch(`${API_BASE}/login-with-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.ok && data.requiresOTP) {
      alert('✅ Check your email for OTP!');
      showLoginOTPForm(email);
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error logging in');
  }
}

async function verifyLoginOTP() {
  try {
    const email = document.getElementById('loginOtpEmail').value;
    const otp = document.getElementById('loginOtpCode').value;

    // Step 2: Verify OTP and login
    const response = await fetch(`${API_BASE}/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (data.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('✅ Logged in successfully!');
      window.location.href = '/dashboard.html';
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error verifying OTP');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 LOGIN WITH GOOGLE AUTHENTICATOR (TOTP)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loginWithTOTP() {
  try {
    const email = document.getElementById('totpLoginEmail').value;
    const password = document.getElementById('totpLoginPassword').value;
    const totpToken = document.getElementById('totpLoginToken').value;

    // Login with TOTP
    const response = await fetch(`${API_BASE}/login-with-totp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        totpToken,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert('✅ Logged in with Google Authenticator!');
      window.location.href = '/dashboard.html';
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error logging in');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showOTPVerificationForm(email, phone, name) {
  // Hide registration form
  document.getElementById('registerForm').style.display = 'none';

  // Show OTP verification form
  document.getElementById('otpForm').style.display = 'block';
  document.getElementById('otpEmail').value = email;
  document.getElementById('otpPhone').value = phone;
  document.getElementById('otpName').value = name;
}

function showLoginOTPForm(email) {
  // Hide login form
  document.getElementById('loginForm').style.display = 'none';

  // Show OTP verification form
  document.getElementById('loginOtpForm').style.display = 'block';
  document.getElementById('loginOtpEmail').value = email;
}

function offerTOTPSetup(userId) {
  localStorage.setItem('userId', userId);
  const offer = confirm(
    'Setup Google Authenticator for extra security? (Recommended)'
  );
  if (offer) {
    setupGoogleAuthenticator();
  }
}

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Check if user is logged in
function isLoggedIn() {
  return !!localStorage.getItem('authToken');
}

// Logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Add token to API requests
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 HTML FORM EXAMPLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*

<!-- Registration Form -->
<div id="registerForm">
  <h2>Register with Email OTP</h2>
  <input type="text" id="name" placeholder="Full Name" />
  <input type="email" id="email" placeholder="Email" />
  <input type="tel" id="phone" placeholder="Phone (9876543210)" />
  <button onclick="registerWithEmailOTP()">Send OTP</button>
</div>

<!-- OTP Verification Form -->
<div id="otpForm" style="display: none;">
  <h2>Verify OTP</h2>
  <input type="hidden" id="otpEmail" />
  <input type="hidden" id="otpPhone" />
  <input type="hidden" id="otpName" />
  <input type="email" id="otpCode" placeholder="Enter 6-digit OTP" />
  <input type="password" id="newPassword" placeholder="Set Password" />
  <button onclick="verifyEmailOTP()">Verify & Register</button>
</div>

<!-- Login Form -->
<div id="loginForm">
  <h2>Login with Email OTP</h2>
  <input type="email" id="loginEmail" placeholder="Email" />
  <input type="password" id="loginPassword" placeholder="Password" />
  <button onclick="loginWithEmail()">Send OTP</button>
</div>

<!-- Login OTP Form -->
<div id="loginOtpForm" style="display: none;">
  <h2>Verify Login OTP</h2>
  <input type="hidden" id="loginOtpEmail" />
  <input type="email" id="loginOtpCode" placeholder="Enter OTP from email" />
  <button onclick="verifyLoginOTP()">Login</button>
</div>

<!-- Google Authenticator Setup -->
<div id="totpSetup" style="display: none;">
  <h2>Setup Google Authenticator</h2>
  <p>1. Scan this QR code with Google Authenticator:</p>
  <div id="qrCode"></div>
  <p>Or manually enter this key: <strong id="secret"></strong></p>
  <p>2. Enter the 6-digit code from your authenticator:</p>
  <input type="text" id="totpToken" placeholder="6-digit code" maxlength="6" />
  <button onclick="verifyTOTPSetup()">Verify & Enable</button>
  <p>⚠️ Save these backup codes:</p>
  <pre id="backupCodes"></pre>
</div>

<!-- Login with Google Authenticator -->
<div id="totpLogin">
  <h2>Login with Google Authenticator</h2>
  <input type="email" id="totpLoginEmail" placeholder="Email" />
  <input type="password" id="totpLoginPassword" placeholder="Password" />
  <input type="text" id="totpLoginToken" placeholder="6-digit code from app" maxlength="6" />
  <button onclick="loginWithTOTP()">Login</button>
</div>

*/
