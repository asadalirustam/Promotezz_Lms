const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  generatePrepMaterial,
  getPrepMaterial,
  updatePrepProgress
} = require('../controllers/examPrepController');

router.post('/generate', protect, authorize('student'), generatePrepMaterial);
router.get('/course/:courseId', protect, getPrepMaterial);
router.put('/course/:courseId/progress', protect, authorize('student'), updatePrepProgress);

module.exports = router;
