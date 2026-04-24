const mongoose = require('mongoose');

const TripPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    name: { type: String, default: '' },
    phone: { type: String, required: true },

    tripTitle: { type: String, required: true },
    fromLocation: { type: String, default: '' },
    destination: { type: String, default: '' },
    travelDate: { type: String, default: '' }, // keep as string for flexibility (can be ISO or human format)
    passengers: { type: String, default: '' },

    customNeeds: { type: String, default: '' },

    status: {
      type: String,
      enum: ['new', 'reviewing', 'planned', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripPlan', TripPlanSchema);

