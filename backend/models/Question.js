const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Index of the correct answer is required (0-3)'],
    min: 0,
    max: 3
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', QuestionSchema);
