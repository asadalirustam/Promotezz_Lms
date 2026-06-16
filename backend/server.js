const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local uploaded files/images in frontend
}));
app.use(cors({
  origin: '*', // For development flexibility; restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
app.use(morgan('dev'));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static Folder for Uploaded Files (Assignments, Resource PDFs, Images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Root route checking server status
app.get('/', (req, res) => {
  res.json({ message: 'AI Department Learning Management System API is running successfully' });
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
