# Shiv Travels Deployment (Best Setup)

This project is a static frontend (`shiv-travels/frontend`) + Node/Express backend (`shiv-travels/backend`) + MongoDB.

## 1) Recommended architecture

- **MongoDB**: MongoDB Atlas (cloud)
- **Backend**: Render / Railway / Fly.io / VPS
- **Frontend**: Netlify / Cloudflare Pages / Vercel (static)

## 2) Backend environment variables

Create `shiv-travels/backend/.env` (copy from `.env.example`) and set:

- `MONGODB_URI` (Atlas connection string)
- `JWT_SECRET` (strong random secret)
- `ADMIN_PHONE` (admin phone, numeric/international preferred e.g. `919824926485`)

Optional:

- `FAST2SMS_API_KEY` (only if you want real OTP SMS)
- WhatsApp Cloud API:
  - `WHATSAPP_CLOUD_API_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_ADMIN_PHONE` (if different from `ADMIN_PHONE`)
- Production CORS allowlist:
  - `FRONTEND_ORIGINS=https://your-frontend-domain.com,https://www.yourdomain.com`

## 3) Run locally

### Backend

```bash
cd shiv-travels/backend
npm install
npm run dev
```

Backend: `http://localhost:4000`

Health check: `GET /api/health`

### Frontend

You can open `shiv-travels/frontend/index.html` directly, but for best results use a local server (VSCode Live Server).

## 4) Frontend API configuration (production)

The frontend uses `shiv-travels/frontend/config.js`.

### Option A (best): Serve frontend from backend

If you access the site from the backend domain, `config.js` automatically uses `window.location.origin`.

### Option B: Separate frontend + backend domains

Set the backend origin once in browser:

```js
localStorage.setItem('SHIV_API_ORIGIN', 'https://your-backend-domain.com');
location.reload();
```

Then set backend env:

`FRONTEND_ORIGINS=https://your-frontend-domain.com`

## 5) Admin creation

Admin is created by **phone match**:

- Register on `create-account.html` using the same phone number you set in backend `.env` as `ADMIN_PHONE`.
- Set your password during OTP verification.

That account becomes `isAdmin=true` and will be redirected to `admin-dashboard.html`.

## 6) OTP SMS notes

OTP is always generated and stored temporarily in memory.

- If `FAST2SMS_API_KEY` is missing: OTP is not sent by SMS (it prints in backend console).
- If `FAST2SMS_API_KEY` is set: backend attempts to send OTP via Fast2SMS.

