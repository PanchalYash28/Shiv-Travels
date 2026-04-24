const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const TripPlan = require('../models/TripPlan');
const { sendWhatsAppToAdmin } = require('../services/whatsapp');

router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      name,
      phone,
      tripTitle,
      fromLocation,
      destination,
      travelDate,
      passengers,
      customNeeds,
    } = req.body || {};

    const phoneNorm = String(phone || '').replace(/[^\d]/g, '');
    if (!phoneNorm) return res.status(400).json({ error: 'phone is required' });
    if (!tripTitle || !String(tripTitle).trim()) return res.status(400).json({ error: 'tripTitle is required' });

    const record = await TripPlan.create({
      user: req.user ? req.user.id : null,
      name: String(name || ''),
      phone: phoneNorm,
      tripTitle: String(tripTitle).trim(),
      fromLocation: String(fromLocation || ''),
      destination: String(destination || ''),
      travelDate: String(travelDate || ''),
      passengers: String(passengers || ''),
      customNeeds: String(customNeeds || ''),
      status: 'new',
    });

    // WhatsApp notify admin (best-effort)
    const adminPhone = process.env.ADMIN_PHONE || process.env.WHATSAPP_ADMIN_PHONE || '';
    if (adminPhone) {
      const message = [
        'New Trip Plan Request (Shiv Travels)',
        `Name: ${name || '-'}`,
        `Phone: ${phoneNorm}`,
        `Trip: ${String(tripTitle).trim()}`,
        fromLocation ? `From: ${fromLocation}` : '',
        destination ? `Destination: ${destination}` : '',
        travelDate ? `Date: ${travelDate}` : '',
        passengers ? `Passengers: ${passengers}` : '',
        customNeeds ? `Needs: ${String(customNeeds).trim().slice(0, 1000)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      await sendWhatsAppToAdmin({ adminPhone, message });
    }

    res.json({ message: 'Trip request submitted', record });
  } catch (err) {
    console.error('TripPlans POST error:', err);
    res.status(500).json({ error: 'Server error submitting trip plan' });
  }
});

router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const items = await TripPlan.find().sort({ createdAt: -1 }).populate('user', 'name phone');
    res.json(items);
  } catch (err) {
    console.error('TripPlans GET admin error:', err);
    res.status(500).json({ error: 'Server error fetching trip plans' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { status } = req.body || {};
    const item = await TripPlan.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Trip plan not found' });
    if (status) item.status = status;
    await item.save();
    res.json({ message: 'Trip plan updated', item });
  } catch (err) {
    console.error('TripPlans PATCH status error:', err);
    res.status(500).json({ error: 'Server error updating trip plan' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await TripPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip plan deleted' });
  } catch (err) {
    console.error('TripPlans DELETE error:', err);
    res.status(500).json({ error: 'Server error deleting trip plan' });
  }
});

module.exports = router;

