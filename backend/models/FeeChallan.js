const mongoose = require('mongoose');

const InstallmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  }
});

const FeeChallanSchema = new mongoose.Schema({
  challanNumber: {
    type: String,
    unique: true,
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  scholarshipAmount: { type: Number, default: 0 },
  fineAmount: { type: Number, default: 0 },
  netPayable: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', ''],
    default: ''
  },
  installments: [InstallmentSchema],
  isInstallment: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paidDate: { type: Date }
}, { timestamps: true });

FeeChallanSchema.pre('save', function (next) {
  const remaining = this.netPayable - this.paidAmount;
  if (this.paidAmount <= 0) this.status = 'unpaid';
  else if (remaining <= 0) this.status = 'paid';
  else this.status = 'partial';
  if (this.status !== 'paid' && new Date() > this.dueDate) this.status = 'overdue';
  next();
});

module.exports = mongoose.model('FeeChallan', FeeChallanSchema);
