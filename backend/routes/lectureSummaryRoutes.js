const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  generateLectureSummary,
  getLectureSummaries,
  saveSummary,
  getSavedSummaries
} = require('../controllers/lectureSummaryController');

router.post('/summarize', protect, authorize('teacher'), upload.single('lectureFile'), generateLectureSummary);
router.get('/course/:courseId', protect, getLectureSummaries);
router.post('/:id/save', protect, authorize('student'), saveSummary);
router.get('/saved', protect, authorize('student'), getSavedSummaries);

module.exports = router;
