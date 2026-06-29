const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-lms', {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if can't connect
      socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
      maxPoolSize: 10,                 // Maintain up to 10 socket connections
      minPoolSize: 2,                  // Keep at least 2 connections open
      connectTimeoutMS: 10000,         // Timeout initial connection after 10s
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
