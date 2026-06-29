const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  grade: {
    type: String,
    default: 'N/A' // e.g. A, B+, C, F
  },
  gradePoints: {
    type: Number,
    default: 0.0 // numeric GPA point equivalent (e.g. 4.0, 3.5)
  },
  midtermMarks: {
    type: Number,
    default: 0
  },
  finalMarks: {
    type: Number,
    default: 0
  },
  sessionalMarks: {
    type: Number,
    default: 0
  },
  assignmentMarks: {
    type: Number,
    default: 0
  },
  quizMarks: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure a student can only have one active enrollment record per course
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
