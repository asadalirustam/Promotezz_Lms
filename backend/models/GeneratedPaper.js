const mongoose = require('mongoose');

const GeneratedPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Paper title is required'],
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  paperType: {
    type: String,
    enum: ['Quiz', 'Midterm', 'Final'],
    required: true
  },
  pdfName: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  questions: [{
    type: {
      type: String,
      enum: ['mcq', 'true_false', 'fill_in_the_blank', 'short_question', 'long_question'],
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    options: [{
      type: String
    }],
    correctAnswer: {
      type: String
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('GeneratedPaper', GeneratedPaperSchema);
