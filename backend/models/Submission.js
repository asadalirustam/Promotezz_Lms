const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileUrl: {
    type: String,
    required: [true, 'Submission file is required']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['submitted', 'graded'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Ensure a student submits exactly once per assignment
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
