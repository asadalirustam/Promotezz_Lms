const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Notice content is required'],
    trim: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notice', NoticeSchema);
