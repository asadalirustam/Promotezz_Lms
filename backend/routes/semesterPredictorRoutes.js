const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { predictSemesterGPA } = require('../controllers/semesterPredictorController');

router.get('/predict', protect, authorize('student'), predictSemesterGPA);

module.exports = router;
