const API_BASE = (window.SHIV_CONFIG && window.SHIV_CONFIG.apiBase) || 'http://localhost:4000/api';
const API_ORIGIN = (window.SHIV_CONFIG && window.SHIV_CONFIG.apiOrigin) || 'http://localhost:4000';
const API_CARS = `${API_BASE}/cars`;
const API_FEEDBACK = `${API_BASE}/feedback`;
const API_SETTINGS = `${API_BASE}/settings`;
const API_SERVICES = `${API_BASE}/services`;
const API_WHATCHOOSE = `${API_BASE}/why-choose`;
const API_REQUIREMENTS = `${API_BASE}/custom-requirements`;
const API_TRIPS = `${API_BASE}/trip-plans`;
const API_SUPPORT = `${API_BASE}/support`;

const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user') || '{}');

const msgEl = document.getElementById('msg');

function resolveAssetUrl(url) {
  const u = String(url || '');
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
  return u;
}

function showMsg(text) {
  if (!msgEl) return;
  msgEl.textContent = text || '';
  setTimeout(() => {
    if (msgEl) msgEl.textContent = '';
  }, 4000);
}

if (!token || !user.isAdmin) {
  alert('Access denied. Admins only.');
  window.location.href = 'login.html';
}

// Logout
document.getElementById('logout').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// -----------------------
// Sidebar navigation
// -----------------------
const sidebarButtons = Array.from(document.querySelectorAll('.sidebar-btn'));
const panels = {
  cars: document.getElementById('panel-cars'),
  services: document.getElementById('panel-services'),
  whychoose: document.getElementById('panel-whychoose'),
  settings: document.getElementById('panel-settings'),
  feedback: document.getElementById('panel-feedback'),
  requirements: document.getElementById('panel-requirements'),
  trips: document.getElementById('panel-trips'),
  support: document.getElementById('panel-support'),
};

function setActivePanel(panelKey) {
  sidebarButtons.forEach((b) => b.classList.toggle('active', b.dataset.panel === panelKey));
  Object.keys(panels).forEach((k) => {
    if (!panels[k]) return;
    panels[k].style.display = k === panelKey ? 'block' : 'none';
  });
}

sidebarButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActivePanel(btn.dataset.panel));
});

// Default panel
setActivePanel('cars');

// -----------------------
// Cars: add/update/delete
// -----------------------
const editCarIdEl = document.getElementById('editCarId');
const carTypeSelect = document.getElementById('carType');
const customCarType = document.getElementById('customCarType');
const seatingSelect = document.getElementById('seatingCapacity');
const customSeating = document.getElementById('customSeating');

carTypeSelect.addEventListener('change', () => {
  if (carTypeSelect.value === 'Other') customCarType.style.display = 'block';
  else {
    customCarType.style.display = 'none';
    customCarType.value = '';
  }
});

seatingSelect.addEventListener('change', () => {
  if (seatingSelect.value === 'Other') customSeating.style.display = 'block';
  else {
    customSeating.style.display = 'none';
    customSeating.value = '';
  }
});

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('images');
const preview = document.getElementById('preview');

let selectedFiles = [];

function renderPreviews(files) {
  preview.innerHTML = '';
  selectedFiles = files || [];
  Array.from(selectedFiles).forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = idx === 0 ? 'thumb-highlight' : 'thumb';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => renderPreviews(fileInput.files ? Array.from(fileInput.files) : []));
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.background = '#eef2ff';
});
dropZone.addEventListener('dragleave', () => {
  dropZone.style.background = '#f9fafb';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.background = '#f9fafb';
  const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
  renderPreviews(files);
  // Keep file input in sync
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  fileInput.files = dt.files;
});

async function loadCars() {
  const list = document.getElementById('car-list');
  list.innerHTML = '<p class="muted">Loading...</p>';

  try {
    const resp = await fetch(API_CARS, { headers: { Authorization: `Bearer ${token}` } });
    const cars = await resp.json();
    if (!Array.isArray(cars) || cars.length === 0) {
      list.innerHTML = '<p>No cars found.</p>';
      return;
    }

    list.innerHTML = cars
      .map((car) => {
        const imgRaw = car.images && car.images.length ? car.images[0] : '/assets/images/innova-crysta.svg';
        const img = resolveAssetUrl(imgRaw);
        const id = car._id || '';
        return `
          <div class="car-card">
            <img src="${img}" alt="${escapeHtml(car.name || 'Car')}" class="thumb-highlight" />
            <h4>${escapeHtml(car.name || '')}</h4>
            <p>${escapeHtml(car.brand || '')} • ${escapeHtml(car.type || '')}</p>
            <p class="meta-row">${escapeHtml(String(car.seatingCapacity || ''))}-Seater</p>
            <div class="admin-actions-row">
              <button class="secondary-btn" onclick="window.__editCar('${id}')">Edit</button>
              <button class="danger-btn" onclick="window.__deleteCar('${id}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p style="color:red">Error loading cars.</p>';
  }
}

function clearCarForm() {
  editCarIdEl.value = '';
  document.getElementById('name').value = '';
  document.getElementById('brand').value = '';
  carTypeSelect.value = '';
  customCarType.value = '';
  customCarType.style.display = 'none';
  seatingSelect.value = '';
  customSeating.value = '';
  customSeating.style.display = 'none';
  document.getElementById('description').value = '';
  document.getElementById('features').value = '';
  preview.innerHTML = '';
  selectedFiles = [];
  fileInput.value = '';
}

window.__editCar = function (carId) {
  const car = window.__carsCache ? window.__carsCache.find((c) => c._id === carId) : null;
  if (!car) return;

  editCarIdEl.value = carId;
  document.getElementById('name').value = car.name || '';
  document.getElementById('brand').value = car.brand || '';
  document.getElementById('description').value = car.description || '';
  document.getElementById('features').value = (car.features || []).join(', ');

  carTypeSelect.value = car.type || '';
  if (!car.type) {
    carTypeSelect.value = '';
  } else if (
    !Array.from(carTypeSelect.options).some((o) => o.value === car.type) &&
    car.type !== 'Other'
  ) {
    carTypeSelect.value = 'Other';
    customCarType.style.display = 'block';
    customCarType.value = car.type;
  } else if (car.type === 'Other') {
    carTypeSelect.value = 'Other';
    customCarType.style.display = 'block';
    customCarType.value = car.type;
  } else {
    customCarType.style.display = 'none';
  }

  seatingSelect.value = String(car.seatingCapacity || '');
  if (!Array.from(seatingSelect.options).some((o) => o.value === String(car.seatingCapacity || '')) && car.seatingCapacity) {
    seatingSelect.value = 'Other';
    customSeating.style.display = 'block';
    customSeating.value = String(car.seatingCapacity);
  }

  showMsg('Editing car. Upload new images to replace them (optional).');
  setActivePanel('cars');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.__deleteCar = async function (carId) {
  if (!confirm('Delete this car?')) return;
  try {
    const resp = await fetch(`${API_CARS}/${carId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => ({}));
    showMsg(data.message || 'Car deleted');
    await loadCars();
    await loadCarsForCache();
  } catch (err) {
    console.error(err);
    showMsg('Error deleting car');
  }
};

async function loadCarsForCache() {
  try {
    const resp = await fetch(API_CARS);
    const cars = await resp.json();
    window.__carsCache = Array.isArray(cars) ? cars : [];
  } catch (e) {
    window.__carsCache = [];
  }
}

document.getElementById('addCar').addEventListener('click', async () => {
  const editId = editCarIdEl.value || '';

  const name = document.getElementById('name').value.trim();
  const brand = document.getElementById('brand').value.trim();
  const type =
    carTypeSelect.value === 'Other' && customCarType.value.trim()
      ? customCarType.value.trim()
      : carTypeSelect.value;
  const description = document.getElementById('description').value.trim();
  const features = document.getElementById('features').value.trim();
  const seatingCapacity =
    seatingSelect.value === 'Other' && customSeating.value.trim()
      ? customSeating.value.trim()
      : seatingSelect.value;

  if (!name || !brand || !type) {
    showMsg('Please fill car name, brand, and type.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('brand', brand);
  formData.append('type', type);
  formData.append('description', description);
  formData.append('seatingCapacity', seatingCapacity);
  formData.append('features', features);

  // Only append images if there are files (edit can be image-empty).
  if (fileInput.files && fileInput.files.length > 0) {
    for (const f of Array.from(fileInput.files)) {
      formData.append('images', f);
    }
  }

  try {
    const url = editId ? `${API_CARS}/${editId}` : API_CARS;
    const method = editId ? 'PUT' : 'POST';

    // When creating, enforce at least 2 images for better cards.
    if (!editId && (!fileInput.files || fileInput.files.length < 2)) {
      showMsg('Please upload at least 2 images for the car.');
      return;
    }

    const resp = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      showMsg(data.error || 'Car operation failed');
      return;
    }

    showMsg(data.message || (editId ? 'Car updated' : 'Car added'));
    clearCarForm();
    await loadCars();
    await loadCarsForCache();
  } catch (err) {
    console.error(err);
    showMsg('Error saving car');
  }
});

// -----------------------
// Services CRUD
// -----------------------
const serviceIconEl = document.getElementById('serviceIcon');
const serviceTitleEl = document.getElementById('serviceTitle');
const serviceDescEl = document.getElementById('serviceDescription');
const editServiceIdEl = document.getElementById('editServiceId');
const saveServiceBtn = document.getElementById('saveServiceBtn');

function clearServiceForm() {
  editServiceIdEl.value = '';
  serviceIconEl.value = '';
  serviceTitleEl.value = '';
  serviceDescEl.value = '';
}

async function loadServices() {
  const list = document.getElementById('services-list');
  list.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const resp = await fetch(API_SERVICES);
    const items = await resp.json();
    if (!Array.isArray(items) || items.length === 0) {
      list.innerHTML = '<p>No services yet.</p>';
      return;
    }
    list.innerHTML = items
      .map((s) => {
        return `
          <div class="car-card">
            <h4>${escapeHtml(s.title || '')}</h4>
            <p>${escapeHtml(s.description || '')}</p>
            <p class="meta-row">${escapeHtml(s.icon || '')}</p>
            <div class="admin-actions-row">
              <button class="secondary-btn" onclick="window.__editService('${s._id}')">Edit</button>
              <button class="danger-btn" onclick="window.__deleteService('${s._id}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p style="color:red">Error loading services.</p>';
  }
}

window.__editService = function (id) {
  const item = (window.__servicesCache || []).find((x) => x._id === id);
  if (!item) return;
  editServiceIdEl.value = id;
  serviceIconEl.value = item.icon || '';
  serviceTitleEl.value = item.title || '';
  serviceDescEl.value = item.description || '';
};

window.__deleteService = async function (id) {
  if (!confirm('Delete this service?')) return;
  try {
    const resp = await fetch(`${API_SERVICES}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => ({}));
    showMsg(data.message || 'Service deleted');
    await loadServices();
    window.__servicesCache = null;
  } catch (err) {
    console.error(err);
    showMsg('Error deleting service');
  }
};

saveServiceBtn.addEventListener('click', async () => {
  const id = editServiceIdEl.value || '';
  const icon = serviceIconEl.value.trim() || '🚗';
  const title = serviceTitleEl.value.trim();
  const description = serviceDescEl.value.trim();

  if (!title) return showMsg('Service title is required');

  try {
    const url = id ? `${API_SERVICES}/${id}` : API_SERVICES;
    const method = id ? 'PUT' : 'POST';

    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, icon }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return showMsg(data.error || 'Service operation failed');

    showMsg(data.message || 'Service saved');
    clearServiceForm();
    await loadServicesAndCache();
  } catch (err) {
    console.error(err);
    showMsg('Error saving service');
  }
});

async function loadServicesAndCache() {
  try {
    const resp = await fetch(API_SERVICES);
    const items = await resp.json();
    window.__servicesCache = Array.isArray(items) ? items : [];
  } catch (e) {
    window.__servicesCache = [];
  }
  await loadServices();
}

// -----------------------
// Why Choose CRUD
// -----------------------
const whyIconEl = document.getElementById('whyIcon');
const whyTitleEl = document.getElementById('whyTitle');
const whyDescEl = document.getElementById('whyDescription');
const editWhyIdEl = document.getElementById('editWhyId');
const saveWhyBtn = document.getElementById('saveWhyBtn');

function clearWhyForm() {
  editWhyIdEl.value = '';
  whyIconEl.value = '';
  whyTitleEl.value = '';
  whyDescEl.value = '';
}

async function loadWhyChoose() {
  const list = document.getElementById('why-list');
  list.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const resp = await fetch(API_WHATCHOOSE);
    const items = await resp.json();
    if (!Array.isArray(items) || items.length === 0) {
      list.innerHTML = '<p>No why-choose items yet.</p>';
      return;
    }
    list.innerHTML = items
      .map((s) => {
        return `
          <div class="car-card">
            <h4>${escapeHtml(s.title || '')}</h4>
            <p>${escapeHtml(s.description || '')}</p>
            <p class="meta-row">${escapeHtml(s.icon || '')}</p>
            <div class="admin-actions-row">
              <button class="secondary-btn" onclick="window.__editWhy('${s._id}')">Edit</button>
              <button class="danger-btn" onclick="window.__deleteWhy('${s._id}')">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p style="color:red">Error loading why-choose items.</p>';
  }
}

window.__editWhy = function (id) {
  const item = (window.__whyCache || []).find((x) => x._id === id);
  if (!item) return;
  editWhyIdEl.value = id;
  whyIconEl.value = item.icon || '';
  whyTitleEl.value = item.title || '';
  whyDescEl.value = item.description || '';
};

window.__deleteWhy = async function (id) {
  if (!confirm('Delete this why-choose item?')) return;
  try {
    const resp = await fetch(`${API_WHATCHOOSE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => ({}));
    showMsg(data.message || 'Item deleted');
    await loadWhyChooseAndCache();
  } catch (err) {
    console.error(err);
    showMsg('Error deleting why-choose item');
  }
};

saveWhyBtn.addEventListener('click', async () => {
  const id = editWhyIdEl.value || '';
  const icon = whyIconEl.value.trim() || '⭐';
  const title = whyTitleEl.value.trim();
  const description = whyDescEl.value.trim();

  if (!title) return showMsg('Why-choose title is required');

  try {
    const url = id ? `${API_WHATCHOOSE}/${id}` : API_WHATCHOOSE;
    const method = id ? 'PUT' : 'POST';

    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, icon }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return showMsg(data.error || 'Why-choose operation failed');

    showMsg(data.message || 'Saved');
    clearWhyForm();
    await loadWhyChooseAndCache();
  } catch (err) {
    console.error(err);
    showMsg('Error saving why-choose item');
  }
});

async function loadWhyChooseAndCache() {
  try {
    const resp = await fetch(API_WHATCHOOSE);
    const items = await resp.json();
    window.__whyCache = Array.isArray(items) ? items : [];
  } catch (e) {
    window.__whyCache = [];
  }
  await loadWhyChoose();
}

// -----------------------
// Settings
// -----------------------
const setBrandName = document.getElementById('setBrandName');
const setBrandLogoUrl = document.getElementById('setBrandLogoUrl');
const setAgentPhone = document.getElementById('setAgentPhone');
const setWhatsappAdminPhone = document.getElementById('setWhatsappAdminPhone');
const setLocationLine = document.getElementById('setLocationLine');
const setHeroTitle = document.getElementById('setHeroTitle');
const setHeroSubtitle = document.getElementById('setHeroSubtitle');
const setFeaturedCarName = document.getElementById('setFeaturedCarName');
const setFeaturedCarImageUrl = document.getElementById('setFeaturedCarImageUrl');
const setMissionText = document.getElementById('setMissionText');
const setVisionText = document.getElementById('setVisionText');
const setFooterCtaText = document.getElementById('setFooterCtaText');
const setFooterSupportLabel = document.getElementById('setFooterSupportLabel');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

async function loadSettings() {
  try {
    const resp = await fetch(API_SETTINGS);
    const s = await resp.json();
    if (!s) return;

    setBrandName.value = s.brandName || '';
    setBrandLogoUrl.value = s.brandLogoUrl || '';
    setAgentPhone.value = s.agentPhone || '';
    setWhatsappAdminPhone.value = s.whatsappAdminPhone || '';
    setLocationLine.value = s.locationLine || '';
    setHeroTitle.value = s.heroTitle || '';
    setHeroSubtitle.value = s.heroSubtitle || '';
    setFeaturedCarName.value = s.featuredCard?.carName || '';
    setFeaturedCarImageUrl.value = s.featuredCard?.carImageUrl || '';
    setMissionText.value = s.missionText || '';
    setVisionText.value = s.visionText || '';
    setFooterCtaText.value = s.footerCtaText || '';
    setFooterSupportLabel.value = s.footerSupportLabel || '';
  } catch (err) {
    console.error(err);
    showMsg('Failed loading settings');
  }
}

saveSettingsBtn.addEventListener('click', async () => {
  const body = {
    brandName: setBrandName.value.trim(),
    brandLogoUrl: setBrandLogoUrl.value.trim(),
    agentPhone: setAgentPhone.value.trim(),
    whatsappAdminPhone: setWhatsappAdminPhone.value.trim(),
    locationLine: setLocationLine.value.trim(),
    heroTitle: setHeroTitle.value.trim(),
    heroSubtitle: setHeroSubtitle.value.trim(),
    featuredCard: {
      carName: setFeaturedCarName.value.trim(),
      carImageUrl: setFeaturedCarImageUrl.value.trim(),
    },
    missionText: setMissionText.value.trim(),
    visionText: setVisionText.value.trim(),
    footerCtaText: setFooterCtaText.value.trim(),
    footerSupportLabel: setFooterSupportLabel.value.trim(),
  };

  try {
    const resp = await fetch(API_SETTINGS, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return showMsg(data.error || 'Settings save failed');

    showMsg(data.message || 'Settings saved');
  } catch (err) {
    console.error(err);
    showMsg('Error saving settings');
  }
});

// -----------------------
// Feedback moderation
// -----------------------
async function loadFeedbackModeration() {
  const pendingEl = document.getElementById('admin-feedbacks');
  const approvedEl = document.getElementById('admin-approved-feedbacks');
  pendingEl.innerHTML = '<p class="muted">Loading...</p>';
  approvedEl.innerHTML = '';

  try {
    const resp = await fetch(`${API_FEEDBACK}/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await resp.json();
    const all = Array.isArray(items) ? items : [];

    const pending = all.filter((f) => !f.isApproved);
    const approved = all.filter((f) => f.isApproved);

    pendingEl.innerHTML = pending.length
      ? pending
          .map((f) => {
            return `
              <div class="car-card feedback-approval-card">
                <h4>${escapeHtml(f.user?.name || 'User')}</h4>
                <p class="meta-row">⭐ ${escapeHtml(String(f.rating || 5))}/5</p>
                <p>${escapeHtml(f.text || '')}</p>
                <div class="admin-actions-row">
                  <button class="secondary-btn" onclick="window.__approveFb('${f._id}')">Approve</button>
                  <button class="danger-btn" onclick="window.__deleteFb('${f._id}')">Delete</button>
                </div>
              </div>
            `;
          })
          .join('')
      : '<p>No pending feedbacks.</p>';

    approvedEl.innerHTML = approved.length
      ? approved
          .map((f) => {
            return `
              <div class="car-card feedback-approval-card">
                <h4>${escapeHtml(f.user?.name || 'User')}</h4>
                <p class="meta-row">⭐ ${escapeHtml(String(f.rating || 5))}/5</p>
                <p>${escapeHtml(f.text || '')}</p>
              </div>
            `;
          })
          .join('')
      : '<p>No approved feedback yet.</p>';

    window.__approveFb = async function (id) {
      try {
        const r = await fetch(`${API_FEEDBACK}/${id}/approve`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Feedback approved');
        await loadFeedbackModeration();
      } catch (err) {
        console.error(err);
        showMsg('Error approving feedback');
      }
    };

    window.__deleteFb = async function (id) {
      if (!confirm('Delete this feedback?')) return;
      try {
        const r = await fetch(`${API_FEEDBACK}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Feedback deleted');
        await loadFeedbackModeration();
      } catch (err) {
        console.error(err);
        showMsg('Error deleting feedback');
      }
    };
  } catch (err) {
    console.error(err);
    pendingEl.innerHTML = '<p style="color:red">Error loading feedbacks.</p>';
  }
}

// -----------------------
// Requirements / Trips / Support admin inboxes
// -----------------------
function renderInboxCard({
  title,
  fieldsHtml,
  actionsHtml,
}) {
  return `
    <div class="car-card">
      <h4>${escapeHtml(title)}</h4>
      ${fieldsHtml || ''}
      <div class="admin-actions-row">
        ${actionsHtml || ''}
      </div>
    </div>
  `;
}

async function loadRequirementsAdmin() {
  const el = document.getElementById('requirements-list');
  el.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const resp = await fetch(`${API_REQUIREMENTS}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await resp.json();
    const list = Array.isArray(items) ? items : [];
    el.innerHTML = list.length
      ? list
          .map((x) => {
            const who = x.name || x.user?.name || 'Customer';
            const status = x.status || 'new';
            const statusPill = status === 'resolved' ? 'Resolved' : status === 'reviewing' ? 'Reviewing' : 'New';
            return `
              <div class="car-card">
                <h4>${escapeHtml(who)}</h4>
                <p class="meta-row">${escapeHtml(x.phone || '')} • <span class="pill">${escapeHtml(statusPill)}</span></p>
                <p>${escapeHtml(x.requirementText || '')}</p>
                <div class="admin-actions-row">
                  <button class="secondary-btn" onclick="window.__reqStatus('${x._id}','reviewing')">Set Reviewing</button>
                  <button class="secondary-btn" onclick="window.__reqStatus('${x._id}','resolved')">Set Resolved</button>
                  <button class="danger-btn" onclick="window.__reqDelete('${x._id}')">Delete</button>
                </div>
              </div>
            `;
          })
          .join('')
      : '<p>No requirements yet.</p>';

    window.__reqStatus = async function (id, status) {
      try {
        const r = await fetch(`${API_REQUIREMENTS}/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Updated');
        await loadRequirementsAdmin();
      } catch (err) {
        console.error(err);
        showMsg('Error updating requirement');
      }
    };

    window.__reqDelete = async function (id) {
      if (!confirm('Delete this requirement?')) return;
      try {
        const r = await fetch(`${API_REQUIREMENTS}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Deleted');
        await loadRequirementsAdmin();
      } catch (err) {
        console.error(err);
        showMsg('Error deleting requirement');
      }
    };
  } catch (err) {
    console.error(err);
    el.innerHTML = '<p style="color:red">Error loading requirements.</p>';
  }
}

async function loadTripsAdmin() {
  const el = document.getElementById('trip-plans-list');
  el.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const resp = await fetch(`${API_TRIPS}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await resp.json();
    const list = Array.isArray(items) ? items : [];
    el.innerHTML = list.length
      ? list
          .map((x) => {
            const who = x.name || x.user?.name || 'Customer';
            const status = x.status || 'new';
            const statusPill = status === 'closed' ? 'Closed' : status === 'planned' ? 'Planned' : status === 'reviewing' ? 'Reviewing' : 'New';
            return `
              <div class="car-card">
                <h4>${escapeHtml(who)}</h4>
                <p class="meta-row">${escapeHtml(x.phone || '')} • ${escapeHtml(x.tripTitle || '')}</p>
                <p class="meta-row"><span class="pill">${escapeHtml(statusPill)}</span> ${escapeHtml(x.destination ? `→ ${x.destination}` : '')}</p>
                <p>${escapeHtml(x.customNeeds || '')}</p>
                <div class="admin-actions-row">
                  <button class="secondary-btn" onclick="window.__tripStatus('${x._id}','reviewing')">Set Reviewing</button>
                  <button class="secondary-btn" onclick="window.__tripStatus('${x._id}','planned')">Set Planned</button>
                  <button class="secondary-btn" onclick="window.__tripStatus('${x._id}','closed')">Set Closed</button>
                  <button class="danger-btn" onclick="window.__tripDelete('${x._id}')">Delete</button>
                </div>
              </div>
            `;
          })
          .join('')
      : '<p>No trip plans yet.</p>';

    window.__tripStatus = async function (id, status) {
      try {
        const r = await fetch(`${API_TRIPS}/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Updated');
        await loadTripsAdmin();
      } catch (err) {
        console.error(err);
        showMsg('Error updating trip plan');
      }
    };

    window.__tripDelete = async function (id) {
      if (!confirm('Delete this trip plan?')) return;
      try {
        const r = await fetch(`${API_TRIPS}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Deleted');
        await loadTripsAdmin();
      } catch (err) {
        console.error(err);
        showMsg('Error deleting trip plan');
      }
    };
  } catch (err) {
    console.error(err);
    el.innerHTML = '<p style="color:red">Error loading trip plans.</p>';
  }
}

async function loadSupportAdmin() {
  const el = document.getElementById('support-list');
  el.innerHTML = '<p class="muted">Loading...</p>';
  try {
    const resp = await fetch(`${API_SUPPORT}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await resp.json();
    const list = Array.isArray(items) ? items : [];
    el.innerHTML = list.length
      ? list
          .map((x) => {
            const who = x.name || x.user?.name || 'Customer';
            const status = x.status || 'open';
            const statusPill = status === 'resolved' ? 'Resolved' : status === 'in_progress' ? 'In Progress' : 'Open';
            return `
              <div class="car-card">
                <h4>${escapeHtml(who)}</h4>
                <p class="meta-row">${escapeHtml(x.phone || '')} • <span class="pill">${escapeHtml(statusPill)}</span></p>
                <p class="meta-row">${escapeHtml(x.category || '')}${x.subject ? ` • ${escapeHtml(x.subject)}` : ''}</p>
                <p>${escapeHtml(x.message || '')}</p>
                <div style="margin-top:10px">
                  <label class="muted" style="font-weight:800">Admin reply (optional)</label>
                  <input id="reply-${x._id}" type="text" placeholder="Write a short reply..." />
                </div>
                <div class="admin-actions-row">
                  <button class="secondary-btn" onclick="window.__supportStatus('${x._id}','open')">Set Open</button>
                  <button class="secondary-btn" onclick="window.__supportStatus('${x._id}','in_progress')">Set In Progress</button>
                  <button class="secondary-btn" onclick="window.__supportStatus('${x._id}','resolved')">Set Resolved</button>
                  <button class="danger-btn" onclick="window.__supportDelete('${x._id}')">Delete</button>
                </div>
              </div>
            `;
          })
          .join('')
      : '<p>No support tickets yet.</p>';

    window.__supportStatus = async function (id, status) {
      const replyInput = document.getElementById(`reply-${id}`);
      const adminReply = replyInput ? replyInput.value.trim() : '';
      try {
        const r = await fetch(`${API_SUPPORT}/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status, adminReply }),
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Updated');
        await loadSupportAdmin();
      } catch (err) {
        console.error(err);
        showMsg('Error updating support ticket');
      }
    };

    window.__supportDelete = async function (id) {
      if (!confirm('Delete this support ticket?')) return;
      try {
        const r = await fetch(`${API_SUPPORT}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json().catch(() => ({}));
        showMsg(d.message || 'Deleted');
        await loadSupportAdmin();
      } catch (err) {
        console.error(err);
        showMsg('Error deleting support ticket');
      }
    };
  } catch (err) {
    console.error(err);
    el.innerHTML = '<p style="color:red">Error loading support tickets.</p>';
  }
}

// -----------------------
// Load everything when admin opens
// -----------------------
async function init() {
  await loadCarsForCache();
  await loadCars();

  // Prefetch others in background
  loadServicesAndCache();
  loadWhyChooseAndCache();
  loadSettings();
  loadFeedbackModeration();
  loadRequirementsAdmin();
  loadTripsAdmin();
  loadSupportAdmin();
}

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

init();

