const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  examDate: {
    type: Date,
    required: true
  },
  weakTopics: [{
    type: String
  }],
  dailyHours: {
    type: Number,
    required: true,
    min: 1,
    max: 24
  },
  planData: {
    dailyPlan: { type: mongoose.Schema.Types.Mixed },
    weeklyPlan: { type: mongoose.Schema.Types.Mixed },
    revisionPlan: { type: mongoose.Schema.Types.Mixed },
    breakSchedule: { type: mongoose.Schema.Types.Mixed }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
