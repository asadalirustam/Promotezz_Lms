const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLeaderboard,
  getGamificationProfile,
  dailyCheckIn
} = require('../controllers/gamificationController');

router.get('/leaderboard', protect, getLeaderboard);
router.get('/profile', protect, getGamificationProfile);
router.post('/checkin', protect, dailyCheckIn);

module.exports = router;
