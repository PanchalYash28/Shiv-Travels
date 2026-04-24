const API_ORIGIN = (window.SHIV_CONFIG && window.SHIV_CONFIG.apiOrigin) || 'http://localhost:4000';
const API_CARS = `${API_ORIGIN}/api/cars`;
const API_FEEDBACK = `${API_ORIGIN}/api/feedback`;
const API_SETTINGS = `${API_ORIGIN}/api/settings`;
const API_SERVICES = `${API_ORIGIN}/api/services`;
const API_WHATCHOOSE = `${API_ORIGIN}/api/why-choose`;
const API_REQUIREMENTS = `${API_ORIGIN}/api/custom-requirements`;
const API_TRIPS = `${API_ORIGIN}/api/trip-plans`;
const API_SUPPORT = `${API_ORIGIN}/api/support`;

const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user') || '{}');

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function digitsOnly(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

function waLink(phone, text) {
  const p = digitsOnly(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(text || '')}`;
}

function resolveAssetUrl(url) {
  const u = String(url || '');
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  // Backend typically stores /uploads/... paths
  if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
  return u;
}

function makeFetchHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// -----------------------
// Nav auth state
// -----------------------
let logoutListenerAttached = false;

function applyAuthNav() {
  const navAdmin = document.getElementById('nav-admin');
  const navProfile = document.getElementById('nav-profile');
  const navLogout = document.getElementById('nav-logout');
  const navLogin = document.getElementById('nav-login');
  const navRegister = document.getElementById('nav-register');

  if (token && user && user.email) {
    if (navAdmin) navAdmin.style.display = user.isAdmin ? 'inline-block' : 'none';
    if (navProfile) navProfile.style.display = 'inline-block';
    if (navLogout) navLogout.style.display = 'inline-block';
    if (navLogin) navLogin.style.display = 'none';
    if (navRegister) navRegister.style.display = 'none';
  } else {
    if (navAdmin) navAdmin.style.display = 'none';
    if (navProfile) navProfile.style.display = 'none';
    if (navLogout) navLogout.style.display = 'none';
    if (navLogin) navLogin.style.display = 'inline-block';
    if (navRegister) navRegister.style.display = 'inline-block';
  }

  // Only attach logout listener once to prevent duplicate event listeners
  if (navLogout && !logoutListenerAttached) {
    logoutListenerAttached = true;
    navLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }
}

// -----------------------
// Smooth scroll
// -----------------------
function applySmoothScroll() {
  const els = Array.from(document.querySelectorAll('[data-scroll]'));
  els.forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = (a.getAttribute('href') || '').replace('#', '');
      if (!hash) return;
      const target = document.getElementById(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// -----------------------
// Flip card sound + animation
// -----------------------
let lastFlipAt = 0;
function playFlipNoise() {
  const now = Date.now();
  if (now - lastFlipAt < 250) return; // avoid rapid re-trigger
  lastFlipAt = now;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1100;
    osc.connect(gain);

    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);

    osc.start(t0);
    osc.stop(t0 + 0.07);

    setTimeout(() => ctx.close && ctx.close(), 120);
  } catch (err) {
    // silent fail
  }
}

function setupFlipCard() {
  const card = document.getElementById('featuredFlipCard');
  if (!card) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // 3D tilt on featured card
  setupTilt(card, { maxTilt: 10, scale: 1.02 });

  const toggle = () => {
    card.classList.toggle('flipped');
    playFlipNoise();
  };

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
}

// -----------------------
// Load settings + render dynamic text/images
// -----------------------
async function loadSettingsAndApply() {
  try {
    const resp = await fetch(API_SETTINGS);
    const s = await resp.json();

    const brandNameEl = document.getElementById('brandName');
    const brandLogoEl = document.getElementById('brandLogo');
    if (s.brandName && brandNameEl) brandNameEl.textContent = s.brandName;
    if (s.brandLogoUrl && brandLogoEl) brandLogoEl.src = s.brandLogoUrl;

    const featuredLogoFront = document.getElementById('featuredBrandLogoFront');
    const featuredBrandText = document.querySelector('.featured-brand-text');
    if (featuredBrandText && s.brandName) featuredBrandText.textContent = s.brandName;
    if (featuredLogoFront && s.brandLogoUrl) featuredLogoFront.src = s.brandLogoUrl;

    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const servicesIntro = document.getElementById('servicesIntro');
    const whyTitle = document.getElementById('whyChooseTitle');

    if (heroTitle) heroTitle.textContent = s.heroTitle || heroTitle.textContent;
    if (heroSubtitle) heroSubtitle.textContent = s.heroSubtitle || heroSubtitle.textContent;
    if (servicesIntro) servicesIntro.textContent = s.servicesIntro || servicesIntro.textContent;
    if (whyTitle) whyTitle.textContent = s.whyChooseTitle || whyTitle.textContent;

    document.getElementById('missionText').textContent = s.missionText || '';
    document.getElementById('visionText').textContent = s.visionText || '';

    // Featured flip card
    const featuredCarName = document.getElementById('featuredCarName');
    const featuredCarImage = document.getElementById('featuredCarImage');
    if (featuredCarName && s.featuredCard?.carName) featuredCarName.textContent = s.featuredCard.carName;
    if (featuredCarImage && s.featuredCard?.carImageUrl) featuredCarImage.src = s.featuredCard.carImageUrl;

    // Links & footer
    const phone = s.agentPhone || '9824926485';
    const adminPhone = s.whatsappAdminPhone || phone;
    const phoneDigits = digitsOnly(phone);

    const heroCallBtn = document.getElementById('heroCallBtn');
    if (heroCallBtn) heroCallBtn.href = `tel:+91${phoneDigits}`;

    const featuredCallLinkFront = document.getElementById('featuredCallLinkFront');
    const featuredCallLinkBack = document.getElementById('featuredCallLinkBack');
    const supportCallBtn = document.getElementById('supportCallBtn');
    const footerCallLink = document.getElementById('footerCallLink');
    if (featuredCallLinkFront) featuredCallLinkFront.href = `tel:+91${phoneDigits}`;
    if (featuredCallLinkBack) featuredCallLinkBack.href = `tel:+91${phoneDigits}`;
    if (supportCallBtn) supportCallBtn.href = `tel:+91${phoneDigits}`;
    if (footerCallLink) footerCallLink.href = `tel:+91${phoneDigits}`;

    const waText = `Hey Shiv Travels, I'm looking to hire a Car on rent. I want a cab Service`;
    const featuredWhatsAppLinkBack = document.getElementById('featuredWhatsAppLinkBack');
    if (featuredWhatsAppLinkBack) featuredWhatsAppLinkBack.href = waLink(adminPhone, waText);

    const supportWhatsAppLink = document.getElementById('supportWhatsAppLink');
    if (supportWhatsAppLink) supportWhatsAppLink.href = waLink(adminPhone, 'Hello Shiv Travels! I need support.');

    const footerWhatsAppLink = document.getElementById('footerWhatsAppLink');
    if (footerWhatsAppLink) footerWhatsAppLink.href = waLink(adminPhone, 'Hello Shiv Travels! Contact support please.');

    const footerCtaText = document.getElementById('footerCtaText');
    if (footerCtaText) footerCtaText.textContent = s.footerCtaText || footerCtaText.textContent;

    const footerLabels = document.querySelectorAll('.footer-label');
    if (footerLabels && footerLabels.length > 0 && s.footerSupportLabel) {
      // The first footer label is "Contact Support"
      footerLabels[0].textContent = s.footerSupportLabel;
    }

    const footerSupportScroll = document.getElementById('footerSupportScroll');
    if (footerSupportScroll && s.footerSupportLabel) footerSupportScroll.textContent = s.footerSupportLabel;

    const footerLocation = document.getElementById('footerLocation');
    if (footerLocation && s.locationLine) footerLocation.textContent = s.locationLine;

    // Also update featured front phone text
    const frontPhoneText = document.getElementById('featuredCallLinkFront');
    if (frontPhoneText) frontPhoneText.textContent = `+91 ${phoneDigits}`;
    const backPhoneText = document.getElementById('featuredCallLinkBack');
    if (backPhoneText) backPhoneText.textContent = 'Call';
  } catch (err) {
    console.error('Settings error:', err);
  }
}

// -----------------------
// Render cars
// -----------------------
async function loadCars() {
  const listEl = document.getElementById('car-list');
  const emptyMsg = document.getElementById('empty-msg');
  if (!listEl || !emptyMsg) return;
  listEl.innerHTML = '';

  try {
    const resp = await fetch(API_CARS);
    if (!resp.ok) throw new Error('Network response not ok');
    const cars = await resp.json();

    if (!Array.isArray(cars) || cars.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';

    listEl.innerHTML = cars
      .map((car) => {
        const rawImg = car.images && car.images.length > 0 ? car.images[0] : 'assets/images/innova-crysta.svg';
        const imgSrc = resolveAssetUrl(rawImg);
        const desc = car.description || '';
        const shortDesc = desc.length > 140 ? `${desc.slice(0, 140)}...` : desc;

        return `
          <article class="card clickable-card">
            <img src="${imgSrc}" alt="${escapeHtml(car.name || 'Car image')}" />
            <div class="card-body">
              <div>
                <h4>${escapeHtml(car.name || '')}</h4>
                <div class="meta">${escapeHtml(car.brand || '')} • ${escapeHtml(car.type || '')} • ${escapeHtml(
                  String(car.seatingCapacity || '')
                )}-seater</div>
                <p>${escapeHtml(shortDesc)}</p>
              </div>
              <div class="card-actions">
                <a class="btn primary" href="car-details.html?id=${car._id}" onclick="event.stopPropagation()">View Details</a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Make whole card clickable without breaking button links
    Array.from(listEl.querySelectorAll('.clickable-card')).forEach((card) => {
      card.addEventListener('click', () => {
        const a = card.querySelector('a[href^="car-details.html"]');
        if (a) window.location.href = a.href;
      });
    });

    // Fancy hover tilt
    setupTiltForGridCards();
  } catch (err) {
    console.error('Could not load cars', err);
    listEl.innerHTML = '<p class="muted">Error loading cars. Make sure your backend is running.</p>';
  }
}

// -----------------------
// Render services + why choose + feedback
// -----------------------
function renderSimpleCards(containerEl, items, renderItem) {
  if (!containerEl) return;
  if (!items || items.length === 0) {
    containerEl.innerHTML = '<p class="muted">Nothing to show right now.</p>';
    return;
  }
  containerEl.innerHTML = items.map(renderItem).join('');
}

async function loadServices() {
  const el = document.getElementById('services-list');
  try {
    const resp = await fetch(API_SERVICES);
    const items = await resp.json();
    renderSimpleCards(el, items, (s) => {
      return `
        <article class="card">
          <div class="card-body">
            <div>
              <h4>${escapeHtml(s.title || '')}</h4>
              <div class="meta">${escapeHtml(s.icon || '🚗')} Service</div>
              <p>${escapeHtml(s.description || '')}</p>
            </div>
          </div>
        </article>
      `;
    });
    setupTiltForGridCards();
  } catch (err) {
    console.error('Services load error:', err);
  }
}

async function loadWhyChoose() {
  const el = document.getElementById('why-list');
  try {
    const resp = await fetch(API_WHATCHOOSE);
    const items = await resp.json();
    renderSimpleCards(el, items, (w) => {
      return `
        <article class="card">
          <div class="card-body">
            <div>
              <h4>${escapeHtml(w.title || '')}</h4>
              <div class="meta">${escapeHtml(w.icon || '⭐')} </div>
              <p>${escapeHtml(w.description || '')}</p>
            </div>
          </div>
        </article>
      `;
    });
    setupTiltForGridCards();
  } catch (err) {
    console.error('Why-choose load error:', err);
  }
}

async function loadFeedbackTestimonials() {
  const el = document.getElementById('feedback-list');
  if (!el) return;
  try {
    const resp = await fetch(API_FEEDBACK);
    const items = await resp.json();
    const list = Array.isArray(items) ? items : [];

    renderSimpleCards(el, list, (f) => {
      const rating = Number(f.rating || 5);
      const stars = Array.from({ length: 5 })
        .map((_, i) => (i < rating ? '★' : '☆'))
        .join('');
      return `
        <article class="card">
          <div class="card-body">
            <div>
              <h4>${escapeHtml(f.user?.name || f.name || 'Customer')}</h4>
              <div class="meta">⭐ ${escapeHtml(String(rating))}/5</div>
              <p>${escapeHtml(f.text || '')}</p>
              <div class="meta" style="margin-top:8px">${escapeHtml(stars)}</div>
            </div>
          </div>
        </article>
      `;
    });
    setupTiltForGridCards();
  } catch (err) {
    console.error('Feedback load error:', err);
  }
}

// -----------------------
// Forms: Requirements / Trips / Support
// -----------------------
async function submitJson(url, body) {
  const headers = makeFetchHeaders();
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function bindForms() {
  const reqForm = document.getElementById('requirementForm');
  const reqMsg = document.getElementById('reqMsg');

  if (reqForm) {
    reqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      reqMsg.textContent = '';
      try {
        const name = document.getElementById('reqName').value.trim();
        const phone = document.getElementById('reqPhone').value.trim();
        const requirementText = document.getElementById('reqText').value.trim();

        if (!phone || !requirementText) {
          reqMsg.textContent = 'Please fill phone and requirement details.';
          return;
        }

        await submitJson(API_REQUIREMENTS, { name, phone, requirementText });
        reqMsg.textContent = 'Thanks! Your requirement has been sent to admin on WhatsApp.';
        reqForm.reset();
      } catch (err) {
        console.error(err);
        reqMsg.textContent = 'Error submitting requirement. Try again.';
      }
    });
  }

  const tripForm = document.getElementById('tripForm');
  const tripMsg = document.getElementById('tripMsg');
  if (tripForm) {
    tripForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      tripMsg.textContent = '';
      try {
        const body = {
          name: document.getElementById('tripName').value.trim(),
          phone: document.getElementById('tripPhone').value.trim(),
          tripTitle: document.getElementById('tripTitle').value.trim(),
          fromLocation: document.getElementById('tripFromLocation').value.trim(),
          destination: document.getElementById('tripDestination').value.trim(),
          travelDate: document.getElementById('tripTravelDate').value.trim(),
          passengers: document.getElementById('tripPassengers').value.trim(),
          customNeeds: document.getElementById('tripCustomNeeds').value.trim(),
        };

        if (!body.phone || !body.tripTitle || !body.customNeeds) {
          tripMsg.textContent = 'Please fill phone, trip title, and custom needs.';
          return;
        }

        await submitJson(API_TRIPS, body);
        tripMsg.textContent = 'Trip request submitted. Admin will contact you soon.';
        tripForm.reset();
      } catch (err) {
        console.error(err);
        tripMsg.textContent = 'Error submitting trip request. Try again.';
      }
    });
  }

  const supportForm = document.getElementById('supportForm');
  const supportMsg = document.getElementById('supportMsg');
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      supportMsg.textContent = '';
      try {
        const body = {
          name: document.getElementById('supportName').value.trim(),
          phone: document.getElementById('supportPhone').value.trim(),
          category: document.getElementById('supportCategory').value,
          subject: document.getElementById('supportSubject').value.trim(),
          message: document.getElementById('supportMessage').value.trim(),
        };

        if (!body.phone || !body.message) {
          supportMsg.textContent = 'Please fill phone and your message.';
          return;
        }

        await submitJson(API_SUPPORT, body);
        supportMsg.textContent = 'Submitted! Admin will review your complaint/query.';
        supportForm.reset();
      } catch (err) {
        console.error(err);
        supportMsg.textContent = 'Error submitting support message. Try again.';
      }
    });
  }
}

async function init() {
  applySmoothScroll();
  applyAuthNav();
  setupFlipCard();
  setupScrollReveal();
  bindForms();

  await loadSettingsAndApply();
  loadCars();
  loadServices();
  loadWhyChoose();
  loadFeedbackTestimonials();
}

document.addEventListener('DOMContentLoaded', init);

// -----------------------
// Modern reveal-on-scroll animations
// -----------------------
function setupScrollReveal() {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const targets = Array.from(document.querySelectorAll('.section, .card, .info-card, .footer-card'));
  targets.forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => io.observe(el));
}

// -----------------------
// Fancy 3D tilt for cards
// -----------------------
function setupTilt(el, { maxTilt = 8, scale = 1.01 } = {}) {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (!el) return;

  el.classList.add('tilt', 'tilt-glow');

  const onMove = (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    const rx = (0.5 - y) * (maxTilt * 2);
    const ry = (x - 0.5) * (maxTilt * 2);

    el.style.setProperty('--gx', `${Math.round(x * 100)}%`);
    el.style.setProperty('--gy', `${Math.round(y * 100)}%`);
    el.classList.add('tilt-active');
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
      2
    )}deg) scale(${scale})`;
  };

  const reset = () => {
    el.classList.remove('tilt-active');
    el.style.transform = '';
  };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', reset);
  el.addEventListener('pointercancel', reset);
}

function setupTiltForGridCards() {
  const cards = Array.from(document.querySelectorAll('.cards-grid .card, .cards-grid-services .card, .cards-grid-why .card'));
  cards.forEach((c) => setupTilt(c, { maxTilt: 6, scale: 1.008 }));
}
