// // server.js
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');

// const app = express();

// // --- Middleware ---

// // app.use(express.json());
// // app.use(express.json({ limit: '10mb' })); // allows large base64 images
// // app.use(cors({ origin: true, credentials: true }));
// // app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// // --- Environment Variables ---
// const PORT = process.env.PORT || 4000;
// const MONGO_URI = process.env.MONGODB_URI;

// // --- MongoDB Connection ---
// mongoose.connect(MONGO_URI)
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ MongoDB connection error:', err));

// // --- API Routes (must be ABOVE static frontend) ---
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/cars', require('./routes/cars'));
// ...existing code...
// app.use('/api/user', require('./routes/user'));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.post('/api/test-upload', require('multer')().array('images', 10), (req, res) => {
//   console.log('files:', req.files?.length);
//   console.log('body:', req.body);
//   res.json({ uploaded: req.files?.length || 0 });
// });


// // --- Serve Frontend Files (AFTER API routes) ---
// app.use(express.static(path.join(__dirname, '../frontend')));

// // --- Fallback for frontend navigation (not API) ---
// // Fallback route — serve frontend for any non-API request
// app.use((req, res, next) => {
//   if (req.originalUrl.startsWith('/api')) {
//     return next(); // skip API requests
//   }
//   res.sendFile(path.join(__dirname, '../frontend/index.html'));
// });


// // --- Start Server ---
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });



// // require("dotenv").config();
// // const express = require("express");
// // const mongoose = require("mongoose");
// // const cors = require("cors");
// // const path = require("path");

// // const app = express();

// // // Middleware
// // app.use(cors({ origin: true, credentials: true }));
// // app.use(express.json({ limit: "20mb" }));
// // app.use(express.urlencoded({ extended: true }));

// // // MongoDB connection
// // mongoose
// //   .connect(process.env.MONGODB_URI)
// //   .then(() => console.log("✅ MongoDB connected"))
// //   .catch((err) => console.error("❌ MongoDB connection error:", err));

// // // Serve uploads folder publicly
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // // Routes
// // app.use("/api/auth", require("./routes/auth"));
// // app.use("/api/cars", require("./routes/cars"));
// ...existing code...
// // app.use("/api/user", require("./routes/user"));

// // // Fallback for frontend
// // app.use((req, res, next) => {
// //   if (req.originalUrl.startsWith("/api")) return next();
// //   res.sendFile(path.join(__dirname, "../frontend/index.html"));
// // });

// // const PORT = process.env.PORT || 4000;
// // app.listen(PORT, () =>
// //   console.log(`🚀 Server running on http://localhost:${PORT}`)
// // );




// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// -----------------------------
// Basic hardening + env validation
// -----------------------------
const REQUIRED_ENVS = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
if (!process.env.ADMIN_PHONE) {
  console.warn('⚠️ ADMIN_PHONE is not set. Admin login will not work.');
}

// Lightweight security headers (no extra dependencies).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Lightweight in-memory rate limiter for auth endpoints.
const rateStore = new Map(); // key -> { count, resetAt }
function rateLimit({ windowMs, max, keyFn }) {
  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    const bucket = rateStore.get(key);

    const resetAt = bucket ? bucket.resetAt : now + windowMs;
    if (!bucket || now > resetAt) {
      rateStore.set(key, { count: 1, resetAt });
      return next();
    }

    if (bucket.count >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    bucket.count += 1;
    rateStore.set(key, bucket);
    return next();
  };
}

// --- Middleware ---
// Allow cross-origin requests
const allowedOrigins = String(process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin/server-side calls and tools like curl/postman with no origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true); // dev default
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: true,
  })
);

// Limit repeated auth attempts (login/otp) to reduce brute force/spam.
app.use('/api/auth', rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }));

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static uploads folder publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Environment Variables ---
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI;

// --- MongoDB Connection ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// --- API Routes ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true, name: 'shiv-travels', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/why-choose', require('./routes/why-choose'));
app.use('/api/custom-requirements', require('./routes/custom-requirements'));
app.use('/api/trip-plans', require('./routes/trip-plans'));
app.use('/api/support', require('./routes/support'));
// ...existing code...
app.use('/api/user', require('./routes/user'));

// --- Test upload route (for debugging) ---
app.post('/api/test-upload', multer().array('images', 10), (req, res) => {
  console.log('📸 Uploaded files:', req.files?.length);
  res.json({ uploaded: req.files?.length || 0 });
});

// --- Serve Frontend Files ---
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Fallback for frontend navigation ---
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next(); // Skip API routes
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

