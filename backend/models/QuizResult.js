const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Ensure a student can only submit a quiz once
QuizResultSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('QuizResult', QuizResultSchema);
