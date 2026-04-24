const API_FEEDBACK = ((window.SHIV_CONFIG && window.SHIV_CONFIG.apiBase) || 'http://localhost:4000/api') + '/feedback';

const msg = document.getElementById('msg');
const token = localStorage.getItem('authToken');

// Star rating logic
let selectedRating = 0;
const starRatingDiv = document.getElementById('star-rating');
function renderStars(rating) {
  starRatingDiv.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (i <= rating ? '' : ' inactive');
    star.innerHTML = '&#9733;';
    star.addEventListener('click', () => {
      selectedRating = i;
      renderStars(selectedRating);
    });
    starRatingDiv.appendChild(star);
  }
}
renderStars(selectedRating);

function renderStaticStars(rating) {
  const r = Number(rating || 0);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star${i <= r ? '' : ' inactive'}">&#9733;</span>`;
  }
  return html;
}

// Lock feedback submission for non-auth users.
const submitBtn = document.getElementById('submitFeedback');
if (!token && submitBtn) {
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.6';
  if (msg) msg.textContent = 'Please login or create an account first.';
}

document.getElementById('submitFeedback').addEventListener('click', async () => {
  const name = document.getElementById('name').value.trim();
  const text = document.getElementById('text').value.trim();
  const rating = selectedRating;

  if (!token) {
    showMsg('Please login or create an account first.');
    return;
  }
  if (!name || !text || !rating) {
    showMsg('Please fill in your name, feedback and select a rating.');
    return;
  }

  try {
    const res = await fetch(API_FEEDBACK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ text, rating, name })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showMsg(data.error || 'Could not submit feedback. Try again.');
      return;
    }
    if (data.message) {
      showMsg(data.message);
      document.getElementById('name').value = '';
      document.getElementById('text').value = '';
      selectedRating = 0;
      renderStars(selectedRating);
      loadFeedback();
    } else {
      showMsg('✅ Feedback submitted for approval.');
      document.getElementById('name').value = '';
      document.getElementById('text').value = '';
      selectedRating = 0;
      renderStars(selectedRating);
      loadFeedback();
    }
  } catch (err) {
    showMsg('Server error: ' + err.message);
  }
});

async function loadFeedback() {
  const list = document.getElementById('feedback-list');
  list.innerHTML = '<p>Loading...</p>';
  try {
    const res = await fetch(API_FEEDBACK);
    const feedbacks = await res.json();

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      list.innerHTML = '<p class="msg">No feedback yet.</p>';
      return;
    }

    list.innerHTML = feedbacks.map(f => `
      <div class="feedback-item">
        <h4>${escapeHtml(f.name || f.user?.name || 'User')}</h4>
        <div class="star-rating">${renderStaticStars(f.rating)}</div>
        <p>${escapeHtml(f.text)}</p>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p>Error loading feedback.</p>';
  }
}

function showMsg(text) {
  msg.textContent = text;
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

document.addEventListener('DOMContentLoaded', loadFeedback);
