const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['salary', 'maintenance', 'electricity', 'internet', 'equipment', 'stationery', 'transport', 'miscellaneous'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  description: { type: String, default: '' },
  date: { type: Date, required: true, default: Date.now },
  vendor: { type: String, default: '' },
  invoiceNumber: { type: String, default: '' },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'online'],
    default: 'cash'
  },
  department: { type: String, default: 'General' },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{ type: String }],
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);
