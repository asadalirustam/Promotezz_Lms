const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { scanQRAttendance } = require('../controllers/attendanceQRController');

router.post('/scan', protect, authorize('teacher', 'admin', 'hod'), scanQRAttendance);

module.exports = router;
