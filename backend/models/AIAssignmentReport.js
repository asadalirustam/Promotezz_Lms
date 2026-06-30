const mongoose = require('mongoose');

const AIAssignmentReportSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  grammarErrors: [{
    type: String,
    trim: true
  }],
  suggestions: [{
    type: String,
    trim: true
  }],
  missingTopics: [{
    type: String,
    trim: true
  }],
  feedback: {
    type: String,
    trim: true,
    required: true
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AIAssignmentReport', AIAssignmentReportSchema);
