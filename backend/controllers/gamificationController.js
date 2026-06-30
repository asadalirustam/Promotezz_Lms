const User = require('../models/User');

// 1. Get Leaderboard (sorted list of students by XP)
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'student' })
      .select('name email level xp badges')
      .sort({ xp: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Retrieve My Gamification Stats & Streak
const getGamificationProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name xp level badges streak');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Daily Active check-in & award Streak points
const dailyCheckIn = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const lastActive = user.streak.lastActive;
    let message = 'Welcome back! Daily check-in complete.';
    let xpGained = 15; // default daily check-in XP

    if (lastActive) {
      const diffMs = now - new Date(lastActive);
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 20) {
        // Less than 20 hours since last check-in, do not trigger streak update yet
        return res.status(200).json({
          success: true,
          message: 'Already checked in today. Keep up the good work!',
          data: { xp: user.xp, level: user.level, streak: user.streak }
        });
      } else if (diffHours >= 20 && diffHours <= 48) {
        // Increment streak
        user.streak.current += 1;
        xpGained += Math.min(user.streak.current * 2, 30); // bonus XP for maintaining streaks!
        message = `Nice! You maintain a ${user.streak.current}-day active streak!`;
      } else {
        // More than 48 hours, streak is broken
        user.streak.current = 1;
        message = 'Streak was broken, starting a new active streak today!';
      }
    } else {
      // First check-in
      user.streak.current = 1;
      message = 'Started your first LMS active streak today!';
    }

    // Award XP
    user.xp += xpGained;
    user.streak.lastActive = now;

    if (user.streak.current > user.streak.max) {
      user.streak.max = user.streak.current;
    }

    // Trigger badge achievements on streak thresholds!
    if (user.streak.current === 7) {
      const hasBadge = user.badges.some(b => b.name === '7-Day Streak Master');
      if (!hasBadge) {
        user.badges.push({ name: '7-Day Streak Master', icon: 'Flame' });
        message += ' Unlocked "7-Day Streak Master" badge!';
      }
    } else if (user.streak.current === 30) {
      const hasBadge = user.badges.some(b => b.name === '30-Day Streak Legend');
      if (!hasBadge) {
        user.badges.push({ name: '30-Day Streak Legend', icon: 'Award' });
        message += ' Unlocked "30-Day Streak Legend" badge!';
      }
    }

    // Award attendance master badge if level increases or check-in count peaks
    if (user.xp >= 100 && user.badges.length === 0) {
      user.badges.push({ name: 'Fast Learner', icon: 'Zap' });
    }

    // Level up calculation (500 XP per level)
    const newLevel = Math.floor(user.xp / 500) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
      user.badges.push({
        name: `Level ${newLevel} Achiever`,
        icon: 'Award'
      });
      message += ` Level Up! You reached Level ${newLevel}!`;
    }

    await user.save();
    res.status(200).json({ success: true, message, xpGained, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  getGamificationProfile,
  dailyCheckIn
};
