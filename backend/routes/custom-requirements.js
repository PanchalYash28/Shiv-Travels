const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const CustomRequirement = require('../models/CustomRequirement');
const { sendWhatsAppToAdmin } = require('../services/whatsapp');

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d]/g, '');
}

// POST public: submit custom requirements (user login optional)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, phone, requirementText } = req.body || {};
    const phoneNorm = normalizePhone(phone);
    if (!phoneNorm) return res.status(400).json({ error: 'phone is required' });
    if (!requirementText || !String(requirementText).trim()) {
      return res.status(400).json({ error: 'requirementText is required' });
    }

    const record = await CustomRequirement.create({
      user: req.user ? req.user.id : null,
      name: String(name || ''),
      phone: phoneNorm,
      requirementText: String(requirementText).trim(),
      status: 'new',
    });

    // Send WhatsApp to admin (best-effort).
    const adminPhone = process.env.ADMIN_PHONE || process.env.WHATSAPP_ADMIN_PHONE || '';
    const message = [
      'New Custom Requirement (Shiv Travels)',
      `Name: ${name || '-'}`,
      `Phone: ${phoneNorm}`,
      `Details: ${String(requirementText).trim().slice(0, 1000)}`,
    ].join('\n');

    if (adminPhone) {
      // Do not fail the request if WhatsApp fails.
      await sendWhatsAppToAdmin({ adminPhone, message });
    } else {
      console.warn('ADMIN_PHONE/WHATSAPP_ADMIN_PHONE missing; skipping WhatsApp send.');
    }

    res.json({ message: 'Requirement submitted', record });
  } catch (err) {
    console.error('CustomRequirements POST error:', err);
    res.status(500).json({ error: 'Server error submitting requirement' });
  }
});

// GET admin: view all requirements
router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const items = await CustomRequirement.find().sort({ createdAt: -1 }).populate('user', 'name phone');
    res.json(items);
  } catch (err) {
    console.error('CustomRequirements GET admin error:', err);
    res.status(500).json({ error: 'Server error fetching requirements' });
  }
});

// PATCH admin: update status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { status } = req.body || {};
    const item = await CustomRequirement.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Requirement not found' });

    if (status) item.status = status;
    await item.save();
    res.json({ message: 'Requirement updated', item });
  } catch (err) {
    console.error('CustomRequirements PATCH status error:', err);
    res.status(500).json({ error: 'Server error updating requirement' });
  }
});

// DELETE admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await CustomRequirement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Requirement deleted' });
  } catch (err) {
    console.error('CustomRequirements DELETE error:', err);
    res.status(500).json({ error: 'Server error deleting requirement' });
  }
});

module.exports = router;

