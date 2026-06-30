const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true
  },
  challan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeChallan',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card'],
    required: true
  },
  transactionId: { type: String, default: '' },
  bankName: { type: String, default: '' },
  paidDate: { type: Date, default: Date.now },
  remainingBalance: { type: Number, default: 0 },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: { type: String, default: '' },
  qrCode: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
