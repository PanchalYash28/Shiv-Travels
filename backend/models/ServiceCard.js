const mongoose = require('mongoose');

const ServiceCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🚗' }, // emoji/icon key for frontend
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCard', ServiceCardSchema);

