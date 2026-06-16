const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getCourseAssignments,
  getAssignmentById,
  submitAssignment,
  gradeSubmission,
  getSubmissionsForAssignment,
  getMySubmission
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'teacher', 'hod'), upload.single('file'), createAssignment);

router.get('/course/:courseId', getCourseAssignments);

router.route('/:id')
  .get(getAssignmentById);

router.post('/:id/submit', authorize('student'), upload.single('file'), submitAssignment);
router.get('/:id/submissions', authorize('admin', 'teacher', 'hod'), getSubmissionsForAssignment);
router.get('/:id/submission/me', authorize('student'), getMySubmission);

router.put('/submissions/:submissionId/grade', authorize('admin', 'teacher', 'hod'), gradeSubmission);

module.exports = router;
