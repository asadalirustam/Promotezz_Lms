const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  records: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    }
  }]
}, {
  timestamps: true
});

// Ensure a single class session per day per course has exactly one attendance log
AttendanceSchema.index({ course: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
