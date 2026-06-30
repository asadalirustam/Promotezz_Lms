const mongoose = require('mongoose');

const FeeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true
  },
  department: {
    type: String,
    default: 'All'
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: true
  },
  tuitionFee: { type: Number, default: 0 },
  semesterFee: { type: Number, default: 0 },
  labFee: { type: Number, default: 0 },
  libraryFee: { type: Number, default: 0 },
  hostelFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },
  examinationFee: { type: Number, default: 0 },
  miscellaneousFee: { type: Number, default: 0 },
  creditHourRate: { type: Number, default: 0 },
  totalCredits: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

FeeStructureSchema.virtual('totalFee').get(function () {
  return (
    this.tuitionFee +
    this.semesterFee +
    this.labFee +
    this.libraryFee +
    this.hostelFee +
    this.transportFee +
    this.examinationFee +
    this.miscellaneousFee +
    this.creditHourRate * this.totalCredits
  );
});

FeeStructureSchema.set('toJSON', { virtuals: true });
FeeStructureSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FeeStructure', FeeStructureSchema);
