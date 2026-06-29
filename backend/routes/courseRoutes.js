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
  getCourseStudents,
  getCourseGradebook,
  updateStudentGrades,
  getMyCourseEnrollment
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

// Student Enrollment Endpoint
router.get('/:id/enrollment/me', authorize('student'), getMyCourseEnrollment);

// Gradebook Endpoints
router.get('/:id/gradebook', authorize('admin', 'teacher', 'hod'), getCourseGradebook);
router.put('/:id/gradebook/:enrollmentId', authorize('admin', 'teacher', 'hod'), updateStudentGrades);

module.exports = router;
