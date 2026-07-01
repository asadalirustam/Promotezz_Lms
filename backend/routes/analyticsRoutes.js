const express = require('express');
const router = express.Router();
const {
  getStudentStats,
  getTeacherStats,
  getHODStats,
  getAdminStats,
  getExamInchargeStats,
  getAccountantStats
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/student', authorize('student'), getStudentStats);
router.get('/teacher', authorize('teacher'), getTeacherStats);
router.get('/hod', authorize('hod'), getHODStats);
router.get('/admin', authorize('admin'), getAdminStats);
router.get('/examination_incharge', authorize('examination_incharge'), getExamInchargeStats);
router.get('/accountant', authorize('accountant'), getAccountantStats);

module.exports = router;
