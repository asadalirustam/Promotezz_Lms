const mongoose = require('mongoose');

const LectureSummarySchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  summaryText: {
    type: String,
    required: true
  },
  keyPoints: [{
    type: String,
    trim: true
  }],
  definitions: [{
    term: { type: String, required: true },
    definition: { type: String, required: true }
  }],
  importantQuestions: [{
    type: String,
    trim: true
  }],
  flashcards: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  revisionNotes: {
    type: String
  },
  savedByStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('LectureSummary', LectureSummarySchema);
