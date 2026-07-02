const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createLecture,
  getLectures,
  updateLectureStatus,
  joinLecture
} = require('../controllers/liveLectureController');

router.use(protect);

router.post('/', authorize('teacher', 'admin', 'hod'), createLecture);
router.get('/course/:courseId', getLectures);
router.put('/:id', authorize('teacher', 'admin', 'hod'), updateLectureStatus);
router.post('/:id/join', joinLecture);

module.exports = router;
