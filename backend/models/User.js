const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'hod'],
    required: [true, 'Role is required']
  },
  profileImage: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Artificial Intelligence'
  },
  semester: {
    type: Number,
    required: function() { return this.role === 'student'; }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
