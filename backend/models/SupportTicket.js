const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    name: { type: String, default: '' },
    phone: { type: String, required: true },

    category: { type: String, default: 'query' }, // 'complaint' | 'query'
    subject: { type: String, default: '' },
    message: { type: String, required: true },

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    adminReply: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);

