const API_BASE = ((window.SHIV_CONFIG && window.SHIV_CONFIG.apiBase) || 'http://localhost:4000/api');
const API_UPDATE = API_BASE + '/user/update';
const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = localStorage.getItem('authToken');
const msg = document.getElementById('msg');

if (!token) {
  alert('Please login first.');
  window.location.href = 'login.html';
}

document.getElementById('name').value = user.name || '';
document.getElementById('email').value = user.email || '';
document.getElementById('phone').value = user.phone || '';

document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

document.getElementById('updateProfile').addEventListener('click', async () => {
  const newName = document.getElementById('name').value.trim();
  const newPassword = document.getElementById('password').value.trim();

  if (!newName) {
    showMsg('❌ Name cannot be empty', 'error');
    return;
  }

  try {
    showMsg('⏳ Updating profile...');
    const res = await fetch(API_UPDATE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ 
        name: newName, 
        password: newPassword || undefined 
      })
    });

    const data = await res.json();
    if (data.ok && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      showMsg('✅ Profile updated successfully!', 'success');
      
      // Update the displayed fields
      document.getElementById('name').value = data.user.name;
      document.getElementById('email').value = data.user.email;
      document.getElementById('phone').value = data.user.phone;
      document.getElementById('password').value = '';
    } else {
      showMsg('❌ ' + (data.error || 'Failed to update profile'), 'error');
    }
  } catch (err) {
    showMsg('❌ Error: ' + err.message, 'error');
  }
});

function showMsg(text, type = 'info') {
  msg.textContent = text;
  msg.className = 'msg ' + type;
  msg.style.display = text ? 'block' : 'none';
}
