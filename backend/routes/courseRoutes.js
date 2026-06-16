const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyEnrolledCourses,
  getCourseStudents
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'teacher', 'hod'), createCourse)
  .get(getCourses);

router.get('/enrolled/me', authorize('student'), getMyEnrolledCourses);

router.route('/:id')
  .get(getCourseById)
  .put(authorize('admin', 'teacher', 'hod'), updateCourse)
  .delete(authorize('admin', 'teacher', 'hod'), deleteCourse);

router.post('/:id/enroll', authorize('student'), enrollInCourse);
router.get('/:id/students', authorize('admin', 'teacher', 'hod'), getCourseStudents);

module.exports = router;
