const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const WhyChoose = require('../models/WhyChoose');

// GET public
router.get('/', async (req, res) => {
  try {
    let items = await WhyChoose.find({ isActive: true }).sort({ createdAt: -1 });
    if (!items || items.length === 0) {
      await WhyChoose.create([
        { title: 'Best Price Guarantee', description: 'Transparent pricing, no hidden charges.', icon: '💸' },
        { title: 'Easy Cancellation', description: 'Customer-first refund policies.', icon: '↩️' },
        { title: 'Verified Partners', description: 'Trusted airlines, hotels & transport.', icon: '✅' },
        { title: 'Local Expertise', description: 'We know the hidden gems & seasons.', icon: '📍' },
        { title: 'Secure Payments', description: 'Encrypted, multiple options.', icon: '🔒' },
        { title: 'Rapid Assistance', description: 'Real-time issue resolution.', icon: '⚡' },
      ]);
      items = await WhyChoose.find({ isActive: true }).sort({ createdAt: -1 });
    }
    res.json(items);
  } catch (err) {
    console.error('Why-choose GET error:', err);
    res.status(500).json({ error: 'Server error fetching why-choose items' });
  }
});

// POST admin create
router.post('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, icon } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const item = await WhyChoose.create({
      title: String(title).trim(),
      description: String(description || ''),
      icon: String(icon || '⭐'),
    });
    res.json({ message: 'Why-choose item created', item });
  } catch (err) {
    console.error('Why-choose POST error:', err);
    res.status(500).json({ error: 'Server error creating why-choose item' });
  }
});

// PUT admin update
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, icon, isActive } = req.body || {};

    const item = await WhyChoose.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (title !== undefined) item.title = String(title).trim();
    if (description !== undefined) item.description = String(description || '');
    if (icon !== undefined) item.icon = String(icon);
    if (isActive !== undefined) item.isActive = Boolean(isActive);

    await item.save();
    res.json({ message: 'Why-choose item updated', item });
  } catch (err) {
    console.error('Why-choose PUT error:', err);
    res.status(500).json({ error: 'Server error updating why-choose item' });
  }
});

// DELETE admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await WhyChoose.findByIdAndDelete(req.params.id);
    res.json({ message: 'Why-choose item deleted' });
  } catch (err) {
    console.error('Why-choose DELETE error:', err);
    res.status(500).json({ error: 'Server error deleting why-choose item' });
  }
});

module.exports = router;

