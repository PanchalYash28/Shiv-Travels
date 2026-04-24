const API_ORIGIN = (window.SHIV_CONFIG && window.SHIV_CONFIG.apiOrigin) || 'http://localhost:4000';
const API_URL = `${API_ORIGIN}/api/cars/`;
const API_SETTINGS = `${API_ORIGIN}/api/settings`;

const token = localStorage.getItem('authToken');

function digitsOnly(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

async function loadCarDetails() {
  const params = new URLSearchParams(window.location.search);
  const carId = params.get('id');

  if (!carId) {
    document.getElementById('car-details').innerHTML =
      '<p class="muted">No car selected.</p>';
    return;
  }

  try {
    const res = await fetch(API_URL + carId);
    if (!res.ok) throw new Error('Car not found');
    const car = await res.json();

    // Pull contact number from admin-editable settings (fallback to default).
    let settings = {};
    try {
      const sResp = await fetch(API_SETTINGS);
      settings = await sResp.json();
    } catch (e) {
      settings = {};
    }
    const agentDigits = digitsOnly(settings.agentPhone || '9824926485');
    const agentPhone = `+91${agentDigits}`;
    const whatsappDigits = digitsOnly(settings.whatsappAdminPhone || agentDigits);

    let images = [];
    if (car.images && car.images.length >= 2) {
      images = car.images.slice(0, 5);
    } else if (car.images && car.images.length === 1) {
      images = [car.images[0]];
    } else {
      images = ["https://via.placeholder.com/600x400?text=Car+Image"];
    }

    // Resolve /uploads paths
    images = images.map((img) => {
      const u = String(img || '');
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
      return u;
    });

    const waText = `Hello Shiv Travels! I would like to rent ${car.name || 'a car'}.`;
    const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(waText)}`;
    const feedbackUrl = token ? 'feedback.html' : 'login.html';

    // Show all images in a scrollable row, but only one is fully visible at a time (centered)
    document.getElementById('car-details').innerHTML = `
      <div class="gallery">
        ${images.map(img => `<img src="${img}" alt="car image"/>`).join('')}
      </div>
      <h2>${escapeHtml(car.name)}</h2>
      <p class="meta">${escapeHtml(car.brand)} • ${escapeHtml(car.type)} • ${escapeHtml(String(car.seatingCapacity))}-Seater</p>
      <p>${escapeHtml(car.description)}</p>
      <div class="enquiry">
        <h3>Enquiry</h3>
        <a class="btn" href="tel:${agentPhone}">📞 Call Now</a>
        <a class="btn" target="_blank" rel="noopener noreferrer"
          href="${whatsappUrl}">
          💬 WhatsApp
        </a>
        <a class="btn" href="${feedbackUrl}">⭐ Give Feedback</a>
      </div>
    `;
  } catch (err) {
    document.getElementById('car-details').innerHTML =
      '<p class="muted">Error loading car details.</p>';
    console.error(err);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

document.addEventListener('DOMContentLoaded', loadCarDetails);
