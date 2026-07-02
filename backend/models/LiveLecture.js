const mongoose = require('mongoose');

const LiveLectureSchema = new mongoose.Schema({
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
  topic: {
    type: String,
    required: [true, 'Lecture topic/title is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  meetingLink: {
    type: String,
    required: [true, 'Meeting/Class room link is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed'],
    default: 'scheduled'
  },
  joinedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('LiveLecture', LiveLectureSchema);
