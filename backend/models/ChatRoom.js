const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  aiSummary: {
    type: String,
    default: ''
  },
  aiActionItems: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
