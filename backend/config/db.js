const mongoose = require('mongoose');
const dns = require('dns');

// Configure Google Public DNS to resolve MongoDB Atlas SRV records reliably on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore error if custom DNS cannot be set
}

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
  }
};

module.exports = connectDB;
