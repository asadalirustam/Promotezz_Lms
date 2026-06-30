const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getDegreeStatus } = require('../controllers/degreeTrackerController');

router.get('/status', protect, authorize('student'), getDegreeStatus);

module.exports = router;
