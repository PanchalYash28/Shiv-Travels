const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const SiteSettings = require('../models/SiteSettings');

const DEFAULT_ADMIN_MISSING_ERROR = 'Admin only.';

// GET: public
router.get('/', async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({}).lean();
    if (!settings) {
      settings = await SiteSettings.create({});
      settings = settings.toObject();
    }
    res.json(settings);
  } catch (err) {
    console.error('Settings GET error:', err);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

// PUT: admin
router.put('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: DEFAULT_ADMIN_MISSING_ERROR });

    const update = req.body || {};
    // Update/patch the single settings document (create if missing).
    let settings = await SiteSettings.findOne({});
    if (!settings) settings = await SiteSettings.create({});

    Object.assign(settings, update);
    await settings.save();

    res.json({ message: 'Settings updated', settings });
  } catch (err) {
    console.error('Settings PUT error:', err);
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

module.exports = router;

