const mongoose = require('mongoose');

const CustomRequirementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    name: { type: String, default: '' },
    phone: { type: String, required: true }, // contact number
    requirementText: { type: String, required: true }, // detailed requirement

    status: {
      type: String,
      enum: ['new', 'reviewing', 'resolved'],
      default: 'new',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomRequirement', CustomRequirementSchema);

