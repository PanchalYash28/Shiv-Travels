const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');
const bcrypt = require('bcryptjs');

// Update user profile
router.put('/update', auth, async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  res.json({
    message: 'Profile updated',
    user: { id: user._id, name: user.name, phone: user.phone, isAdmin: user.isAdmin }
  });
});

module.exports = router;
