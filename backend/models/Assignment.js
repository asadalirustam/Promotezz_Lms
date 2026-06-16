const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxPoints: {
    type: Number,
    required: [true, 'Maximum points are required'],
    min: 0
  },
  fileUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
