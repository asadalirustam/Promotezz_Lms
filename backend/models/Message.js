const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    enum: ['text', 'image', 'document', 'voice'],
    default: 'text'
  },
  translatedText: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
