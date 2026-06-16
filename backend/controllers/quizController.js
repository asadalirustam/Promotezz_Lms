const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizResult = require('../models/QuizResult');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create new quiz (includes adding questions)
// @route   POST /api/quizzes
// @access  Private (Teacher/Admin/HOD)
const createQuiz = async (req, res) => {
  try {
    const { title, courseId, duration, passingMarks, questions } = req.body;

    if (!title || !courseId || !duration || !passingMarks || !questions || !questions.length) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields and at least one question' });
    }

    // Verify course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // If teacher, verify ownership
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to create quizzes for this course' });
    }

    // Create the Quiz object
    const quiz = await Quiz.create({
      title,
      course: courseId,
      duration,
      passingMarks,
      totalMarks: questions.length
    });

    // Create and save all MCQ questions
    const questionDocs = questions.map(q => ({
      quiz: quiz._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer
    }));

    const savedQuestions = await Question.insertMany(questionDocs);
    
    // Bind questions to Quiz
    quiz.questions = savedQuestions.map(sq => sq._id);
    await quiz.save();

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quizzes for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
const getCourseQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId });
    res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single quiz (with questions)
// @route   GET /api/quizzes/:id
// @access  Private
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Check if student already attempted it
    const attempt = await QuizResult.findOne({ quiz: req.params.id, student: req.user.id });

    // Format response questions: Hide correctAnswer if user is student AND has not submitted yet
    const formattedQuiz = quiz.toObject();
    
    if (req.user.role === 'student' && !attempt) {
      formattedQuiz.questions = formattedQuiz.questions.map(q => {
        const { correctAnswer, ...cleanQ } = q;
        return cleanQ;
      });
    }

    res.status(200).json({
      success: true,
      hasAttempted: !!attempt,
      attemptData: attempt || null,
      data: formattedQuiz
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit quiz attempt and get instant score evaluation
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student)
const submitQuizAttempt = async (req, res) => {
  try {
    const { answers } = req.body; // Array: [{ questionId, selectedOption }]
    
    const quiz = await Quiz.findById(req.params.id).populate('questions');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Verify enrollment
    const isEnrolled = await Enrollment.findOne({ student: req.user.id, course: quiz.course });
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'You must be enrolled in this course' });
    }

    // Check duplicate attempt
    const alreadyAttempted = await QuizResult.findOne({ quiz: req.params.id, student: req.user.id });
    if (alreadyAttempted) {
      return res.status(400).json({ success: false, message: 'Quiz already attempted' });
    }

    // Grade attempt
    let score = 0;
    const gradedAnswers = [];

    quiz.questions.forEach(question => {
      const studentAnswer = answers.find(ans => ans.questionId === question._id.toString());
      const selectedOption = studentAnswer ? studentAnswer.selectedOption : -1;
      const isCorrect = selectedOption === question.correctAnswer;
      
      if (isCorrect) {
        score++;
      }

      gradedAnswers.push({
        question: question._id,
        selectedOption
      });
    });

    const passed = score >= quiz.passingMarks;

    const result = await QuizResult.create({
      quiz: quiz._id,
      student: req.user.id,
      score,
      passed,
      answers: gradedAnswers
    });

    res.status(201).json({
      success: true,
      data: {
        score,
        totalMarks: quiz.totalMarks,
        passed,
        resultId: result._id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all quiz results for a teacher's gradebook view
// @route   GET /api/quizzes/:id/results
// @access  Private (Teacher/Admin/HOD)
const getQuizResults = async (req, res) => {
  try {
    const results = await QuizResult.find({ quiz: req.params.id })
      .populate('student', 'name email semester');
    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuiz,
  getCourseQuizzes,
  getQuizById,
  submitQuizAttempt,
  getQuizResults
};
