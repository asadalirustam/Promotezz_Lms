const mongoose = require('mongoose');

const ExamPrepSchema = new mongoose.Schema({
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
  practiceMCQs: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true }
  }],
  trueFalse: [{
    statement: { type: String, required: true },
    answer: { type: Boolean, required: true }
  }],
  shortQuestions: [{
    question: { type: String, required: true },
    keywords: [{ type: String }]
  }],
  longQuestions: [{
    question: { type: String, required: true },
    outline: [{ type: String }]
  }],
  flashcards: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  progress: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExamPrep', ExamPrepSchema);
