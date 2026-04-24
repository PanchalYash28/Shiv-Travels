const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ServiceCard = require('../models/ServiceCard');

// GET public
router.get('/', async (req, res) => {
  try {
    let services = await ServiceCard.find({ isActive: true }).sort({ createdAt: -1 });
    if (!services || services.length === 0) {
      // Seed defaults (admin can later edit/remove)
      await ServiceCard.create([
        {
          title: 'Car Bookings',
          description: 'Convenient local and outstation rides at affordable prices, best fares.',
          icon: '🚘',
        },
        {
          title: 'Travel Package',
          description: 'Customized trips with flights, stays, and guided experiences.',
          icon: '✈️',
        },
        {
          title: 'Marriage Booking',
          description: 'Complete wedding travel and guest transport solutions.',
          icon: '💍',
        },
        {
          title: 'Corporate Booking',
          description: 'Reliable business travel and group transport services.',
          icon: '🏢',
        },
        {
          title: 'Holiday Packages',
          description: 'Family, group tours',
          icon: '🏖️',
        },
        {
          title: 'Family/Personal Booking',
          description: 'Comfortable travel plans for family vacations or personal trips.',
          icon: '👨‍👩‍👧‍👦',
        },
        {
          title: '24/7 Support',
          description: 'Before, during & after trip',
          icon: '🛟',
        },
      ]);
      services = await ServiceCard.find({ isActive: true }).sort({ createdAt: -1 });
    }
    res.json(services);
  } catch (err) {
    console.error('Services GET error:', err);
    res.status(500).json({ error: 'Server error fetching services' });
  }
});

// POST admin create
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, icon } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const service = await ServiceCard.create({
      title: String(title).trim(),
      description: String(description || ''),
      icon: String(icon || '🚗'),
    });
    res.json({ message: 'Service created', service });
  } catch (err) {
    console.error('Services POST error:', err);
    res.status(500).json({ error: 'Server error creating service' });
  }
});

// PUT admin update
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, icon, isActive } = req.body || {};
    const service = await ServiceCard.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    if (title !== undefined) service.title = String(title).trim();
    if (description !== undefined) service.description = String(description || '');
    if (icon !== undefined) service.icon = String(icon || '🚗');
    if (isActive !== undefined) service.isActive = Boolean(isActive);

    await service.save();
    res.json({ message: 'Service updated', service });
  } catch (err) {
    console.error('Services PUT error:', err);
    res.status(500).json({ error: 'Server error updating service' });
  }
});

// DELETE admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await ServiceCard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('Services DELETE error:', err);
    res.status(500).json({ error: 'Server error deleting service' });
  }
});

module.exports = router;

