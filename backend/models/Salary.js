const mongoose = require('mongoose');

const AllowanceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 }
});

const DeductionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 }
});

const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: [AllowanceSchema],
  deductions: [DeductionSchema],
  bonus: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'paid', 'on_hold'],
    default: 'pending'
  },
  paymentDate: { type: Date },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque'],
    default: 'bank_transfer'
  },
  bankAccount: { type: String, default: '' },
  slipNumber: { type: String, unique: true },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

SalarySchema.pre('save', function (next) {
  const totalAllowances = this.allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);
  this.grossSalary = this.basicSalary + totalAllowances + this.bonus + this.overtime;
  this.netSalary = this.grossSalary - totalDeductions - this.taxAmount;
  next();
});

module.exports = mongoose.model('Salary', SalarySchema);
