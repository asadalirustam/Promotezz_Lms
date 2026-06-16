const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load models
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Notice = require('./models/Notice');
const Resource = require('./models/Resource');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const QuizResult = require('./models/QuizResult');
const Attendance = require('./models/Attendance');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-lms');
    console.log('MongoDB Connected for Seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const hashPassword = (pw) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pw, salt);
};

const seedData = async () => {
  try {
    // 1. Clear database
    await User.deleteMany();
    await Course.deleteMany();
    await Enrollment.deleteMany();
    await Notice.deleteMany();
    await Resource.deleteMany();
    await Assignment.deleteMany();
    await Submission.deleteMany();
    await Quiz.deleteMany();
    await Question.deleteMany();
    await QuizResult.deleteMany();
    await Attendance.deleteMany();

    console.log('All collections cleared!');

    // 2. Create Users
    const users = [
      {
        name: 'System Administrator',
        email: 'admin@ailms.edu',
        password: hashPassword('admin123'),
        role: 'admin',
        department: 'Artificial Intelligence'
      },
      {
        name: 'Dr. Arthur Pendelton (HOD)',
        email: 'hod@ailms.edu',
        password: hashPassword('hod123'),
        role: 'hod',
        department: 'Artificial Intelligence'
      },
      {
        name: 'Dr. Sarah Chen',
        email: 'sarah@ailms.edu',
        password: hashPassword('teacher123'),
        role: 'teacher',
        department: 'Artificial Intelligence'
      },
      {
        name: 'Prof. David Miller',
        email: 'david@ailms.edu',
        password: hashPassword('teacher123'),
        role: 'teacher',
        department: 'Artificial Intelligence'
      },
      {
        name: 'Alex Mercer',
        email: 'alex@ailms.edu',
        password: hashPassword('student123'),
        role: 'student',
        semester: 5,
        department: 'Artificial Intelligence'
      },
      {
        name: 'Emily Stone',
        email: 'emily@ailms.edu',
        password: hashPassword('student123'),
        role: 'student',
        semester: 5,
        department: 'Artificial Intelligence'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Users seeded successfully!');

    // Extract user objects
    const admin = createdUsers.find(u => u.role === 'admin');
    const hod = createdUsers.find(u => u.role === 'hod');
    const sarah = createdUsers.find(u => u.name === 'Dr. Sarah Chen');
    const david = createdUsers.find(u => u.name === 'Prof. David Miller');
    const alex = createdUsers.find(u => u.name === 'Alex Mercer');
    const emily = createdUsers.find(u => u.name === 'Emily Stone');

    // 3. Create Courses
    const courses = [
      {
        name: 'Machine Learning',
        code: 'AI-301',
        description: 'Introduction to supervised/unsupervised algorithms, regression, classification, SVMs, and decision trees.',
        creditHours: 4,
        semester: 5,
        teacher: sarah._id,
        category: 'Core'
      },
      {
        name: 'Natural Language Processing',
        code: 'AI-302',
        description: 'Text preprocessing, syntax analysis, language modeling, Word2Vec, Recurrent Neural Networks, and Transformers.',
        creditHours: 3,
        semester: 5,
        teacher: david._id,
        category: 'Core'
      },
      {
        name: 'Deep Learning',
        code: 'AI-303',
        description: 'Neural network architectures, backpropagation, CNNs, optimization routines, and regularization techniques.',
        creditHours: 4,
        semester: 6,
        teacher: sarah._id,
        category: 'Core'
      },
      {
        name: 'Computer Vision',
        code: 'AI-304',
        description: 'Image processing filters, edge detection, feature extraction, object detection with CNNs, and YOLO models.',
        creditHours: 3,
        semester: 6,
        teacher: david._id,
        category: 'Elective'
      },
      {
        name: 'Generative AI',
        code: 'AI-401',
        description: 'Understanding GANs, VAEs, Diffusion models, LLM architectures, instruction fine-tuning, and prompts engineering.',
        creditHours: 3,
        semester: 7,
        teacher: sarah._id,
        category: 'Elective'
      }
    ];

    const createdCourses = await Course.insertMany(courses);
    console.log('Courses seeded successfully!');

    const mlCourse = createdCourses.find(c => c.code === 'AI-301');
    const nlpCourse = createdCourses.find(c => c.code === 'AI-302');

    // 4. Create Enrollments
    const enrollments = [
      { student: alex._id, course: mlCourse._id, status: 'active' },
      { student: alex._id, course: nlpCourse._id, status: 'active' },
      { student: emily._id, course: mlCourse._id, status: 'active' },
      { student: emily._id, course: nlpCourse._id, status: 'active' }
    ];

    await Enrollment.insertMany(enrollments);
    console.log('Enrollments seeded successfully!');

    // 5. Create Noticeboard
    const notices = [
      {
        title: 'Welcome to the Artificial Intelligence Department Portal',
        content: 'We are excited to launch the new AI-LMS dashboard. You can access syllabus resources, upload assignment files, view grading cards, and review attendance records directly.',
        pinned: true,
        author: admin._id
      },
      {
        title: 'Upcoming AI Symposium & Hackathon',
        content: 'The department is hosting a Generative AI hackathon this Friday at 10:00 AM. Register your teams before Thursday midnight at the HOD desk.',
        pinned: false,
        author: hod._id
      }
    ];

    await Notice.insertMany(notices);
    console.log('Notices seeded successfully!');

    // 6. Create Resources
    const resources = [
      {
        title: 'Attention Is All You Need Research Paper',
        description: 'The seminal transformer architecture paper published by Google Brain.',
        type: 'Research Paper',
        url: 'https://arxiv.org/pdf/1706.03762',
        course: nlpCourse._id,
        uploadedBy: david._id
      },
      {
        title: 'Kaggle House Pricing Dataset',
        description: 'CSV file containing Ames, Iowa housing dataset for regression modeling.',
        type: 'AI Dataset',
        url: 'https://www.kaggle.com/c/house-prices-advanced-regression-techniques/data',
        course: mlCourse._id,
        uploadedBy: sarah._id
      },
      {
        title: 'Stanford CS229: Machine Learning Lecture Notes',
        description: 'Complete syllabus slides and mathematical notebooks regarding machine learning theory.',
        type: 'Lecture Notes',
        url: 'https://cs229.stanford.edu/syllabus.html',
        course: mlCourse._id,
        uploadedBy: sarah._id
      }
    ];

    await Resource.insertMany(resources);
    console.log('Resources seeded successfully!');

    // 7. Create Assignments
    const assignmentDate = new Date();
    assignmentDate.setDate(assignmentDate.getDate() + 7); // Due in 7 days

    const assignment = await Assignment.create({
      title: 'ML Assignment 1: Linear Regression implementation',
      description: 'Implement Gradient Descent from scratch in a Jupyter notebook using NumPy. Do not use scikit-learn for model fitting. Submit as a ZIP file or IPYNB file.',
      course: mlCourse._id,
      dueDate: assignmentDate,
      maxPoints: 50
    });
    console.log('Assignments seeded successfully!');

    // 8. Create a Quiz
    const quiz = await Quiz.create({
      title: 'Machine Learning Basics - MCQ Quiz 1',
      course: mlCourse._id,
      duration: 10, // 10 minutes
      passingMarks: 2,
      totalMarks: 3
    });

    const questions = [
      {
        quiz: quiz._id,
        questionText: 'Which algorithm is typically used for classification tasks?',
        options: ['Linear Regression', 'Logistic Regression', 'K-Means Clustering', 'A/B Testing'],
        correctAnswer: 1 // Logistic Regression
      },
      {
        quiz: quiz._id,
        questionText: 'What is the primary function of an activation function in a neural network?',
        options: ['To calculate gradients', 'To introduce non-linearity', 'To optimize weights', 'To standardize inputs'],
        correctAnswer: 1 // To introduce non-linearity
      },
      {
        quiz: quiz._id,
        questionText: 'Overfitting occurs when a model performs...',
        options: [
          'Well on training data and well on testing data',
          'Poorly on training data and poorly on testing data',
          'Well on training data but poorly on testing data',
          'Poorly on training data but well on testing data'
        ],
        correctAnswer: 2 // Well on training data but poorly on testing data
      }
    ];

    const createdQs = await Question.insertMany(questions);
    quiz.questions = createdQs.map(q => q._id);
    await quiz.save();
    console.log('Quiz and Questions seeded successfully!');

    // 9. Attendance
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    await Attendance.create({
      course: mlCourse._id,
      date: yesterday,
      records: [
        { student: alex._id, status: 'present' },
        { student: emily._id, status: 'present' }
      ]
    });

    await Attendance.create({
      course: mlCourse._id,
      date: today,
      records: [
        { student: alex._id, status: 'present' },
        { student: emily._id, status: 'late' }
      ]
    });
    console.log('Attendance sheets seeded successfully!');

    console.log('Database seeded with AI-LMS mock data successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
});
