const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['PDF', 'Research Paper', 'Lecture Notes', 'AI Dataset', 'YouTube Link', 'GitHub Repo'],
    required: [true, 'Resource type is required']
  },
  url: {
    type: String,
    required: [true, 'Resource link or path is required'],
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resource', ResourceSchema);
