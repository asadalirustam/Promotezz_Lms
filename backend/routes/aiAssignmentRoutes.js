const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  evaluateAssignment,
  getAIReport,
  downloadAIReport
} = require('../controllers/aiAssignmentController');

// All routes are protected by auth token
router.post('/evaluate', protect, evaluateAssignment);
router.get('/report/:submissionId', protect, getAIReport);
router.get('/report/:submissionId/download', protect, downloadAIReport);

module.exports = router;
