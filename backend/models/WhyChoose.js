const mongoose = require('mongoose');

const WhyChooseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '⭐' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhyChoose', WhyChooseSchema);

