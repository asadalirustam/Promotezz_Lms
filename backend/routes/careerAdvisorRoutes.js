const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getCareerAdvice,
  updateCareerProfile
} = require('../controllers/careerAdvisorController');

router.get('/recommend', protect, authorize('student'), getCareerAdvice);
router.put('/profile', protect, authorize('student'), updateCareerProfile);

module.exports = router;
