const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getCourseAttendanceLogs,
  getStudentCourseAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('admin', 'teacher', 'hod'), markAttendance);
router.get('/course/:courseId', authorize('admin', 'teacher', 'hod'), getCourseAttendanceLogs);
router.get('/student/:studentId/course/:courseId', getStudentCourseAttendance);

module.exports = router;
