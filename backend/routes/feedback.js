const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middlewares/auth');

// 🗨️ Add feedback (user must be logged in)
router.post('/', auth, async (req, res) => {
  const { text, rating } = req.body;
  if (!text) return res.status(400).json({ error: 'Feedback text required' });

  const feedback = new Feedback({
    user: req.user.id,
    text,
    rating: rating || 5,
    isApproved: false
  });

  await feedback.save();
  res.json({ message: 'Feedback submitted, pending admin approval', feedback });
});

// 👁️ Get all approved feedbacks (public)
router.get('/', async (req, res) => {
  const feedbacks = await Feedback.find({ isApproved: true }).populate('user', 'name');
  res.json(feedbacks);
});

// ✅ Admin approve feedback
router.post('/:id/approve', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const fb = await Feedback.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  res.json({ message: 'Feedback approved', feedback: fb });
});

// 🗑️ Admin delete feedback
router.delete('/:id', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ message: 'Feedback deleted' });
});

// 🧾 Admin get all feedbacks (approved + pending)
router.get('/admin/all', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const allFeedbacks = await Feedback.find().populate('user', 'name phone');
  res.json(allFeedbacks);
});

module.exports = router;
