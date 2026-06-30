const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['sibling', 'employee_child', 'special', 'promotional', 'other'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  percentage: { type: Number, min: 0, max: 100, default: 0 },
  applicableFrom: { type: Date, required: true },
  applicableTo: { type: Date },
  isActive: { type: Boolean, default: true },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Discount', DiscountSchema);
