const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  creditHours: {
    type: Number,
    required: [true, 'Credit hours are required'],
    min: 1,
    max: 6
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher reference is required']
  },
  category: {
    type: String,
    enum: ['Core', 'Elective'],
    required: [true, 'Course category is required']
  },
  schedule: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, required: true }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', CourseSchema);
