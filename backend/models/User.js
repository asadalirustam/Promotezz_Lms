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
    enum: ['student', 'teacher', 'admin', 'hod', 'examination_incharge', 'accountant'],
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
  },
  skills: [{
    type: String,
    trim: true
  }],
  interests: [{
    type: String,
    trim: true
  }],
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  }],
  streak: {
    current: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    lastActive: { type: Date }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
