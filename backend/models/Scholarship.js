const mongoose = require('mongoose');

const ScholarshipSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['merit', 'need_based', 'sports', 'departmental', 'government', 'other'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  academicYear: { type: String, required: true },
  semester: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'expired'],
    default: 'pending'
  },
  appliedDate: { type: Date, default: Date.now },
  approvedDate: { type: Date },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: { type: String, default: '' },
  documents: [{ type: String }],
  expiryDate: { type: Date },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Scholarship', ScholarshipSchema);
