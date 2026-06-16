const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    min: 1
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 0
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', QuizSchema);
