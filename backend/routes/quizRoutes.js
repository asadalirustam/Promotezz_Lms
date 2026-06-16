const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getCourseQuizzes,
  getQuizById,
  submitQuizAttempt,
  getQuizResults
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'teacher', 'hod'), createQuiz);

router.get('/course/:courseId', getCourseQuizzes);

router.route('/:id')
  .get(getQuizById);

router.post('/:id/submit', authorize('student'), submitQuizAttempt);
router.get('/:id/results', authorize('admin', 'teacher', 'hod'), getQuizResults);

module.exports = router;
