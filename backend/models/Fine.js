const mongoose = require('mongoose');

const FineSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeChallan'
  },
  type: {
    type: String,
    enum: ['late_fee', 'library', 'hostel', 'examination', 'discipline', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Fine amount cannot be negative']
  },
  reason: { type: String, required: true },
  issuedDate: { type: Date, default: Date.now },
  paidDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'paid', 'waived'],
    default: 'pending'
  },
  waiveReason: { type: String, default: '' },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Fine', FineSchema);
