const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const SupportTicket = require('../models/SupportTicket');
const { sendWhatsAppToAdmin } = require('../services/whatsapp');

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, phone, category, subject, message } = req.body || {};
    const phoneNorm = String(phone || '').replace(/[^\d]/g, '');
    if (!phoneNorm) return res.status(400).json({ error: 'phone is required' });
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'message is required' });

    const record = await SupportTicket.create({
      user: req.user ? req.user.id : null,
      name: String(name || ''),
      phone: phoneNorm,
      category: String(category || 'query'),
      subject: String(subject || ''),
      message: String(message).trim(),
      status: 'open',
    });

    // WhatsApp notify admin (best-effort)
    const adminPhone = process.env.ADMIN_PHONE || process.env.WHATSAPP_ADMIN_PHONE || '';
    if (adminPhone) {
      const messageText = [
        'New Support Message (Shiv Travels)',
        `Category: ${String(category || 'query')}`,
        `Name: ${name || '-'}`,
        `Phone: ${phoneNorm}`,
        subject ? `Subject: ${subject}` : '',
        `Message: ${String(message).trim().slice(0, 1200)}`,
      ]
        .filter(Boolean)
        .join('\n');
      await sendWhatsAppToAdmin({ adminPhone, message: messageText });
    }

    res.json({ message: 'Support ticket created', record });
  } catch (err) {
    console.error('Support POST error:', err);
    res.status(500).json({ error: 'Server error submitting support ticket' });
  }
});

router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const items = await SupportTicket.find().sort({ createdAt: -1 }).populate('user', 'name phone');
    res.json(items);
  } catch (err) {
    console.error('Support GET admin error:', err);
    res.status(500).json({ error: 'Server error fetching support tickets' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    const { status, adminReply } = req.body || {};

    const item = await SupportTicket.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Support ticket not found' });

    if (status) item.status = status;
    if (adminReply !== undefined) item.adminReply = String(adminReply);

    await item.save();
    res.json({ message: 'Support ticket updated', item });
  } catch (err) {
    console.error('Support PATCH status error:', err);
    res.status(500).json({ error: 'Server error updating support ticket' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Support ticket deleted' });
  } catch (err) {
    console.error('Support DELETE error:', err);
    res.status(500).json({ error: 'Server error deleting support ticket' });
  }
});

module.exports = router;

