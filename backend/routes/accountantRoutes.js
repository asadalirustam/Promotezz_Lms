const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getDashboardStats,
  getMonthlyRevenue,
  getAIPrediction,
  getFinanceReport
} = require('../controllers/accountantController');

const canAccess = ['admin', 'accountant'];

router.get('/stats', protect, authorize(...canAccess), getDashboardStats);
router.get('/monthly-revenue', protect, authorize(...canAccess), getMonthlyRevenue);
router.get('/ai-prediction', protect, authorize(...canAccess), getAIPrediction);
router.get('/reports', protect, authorize(...canAccess), getFinanceReport);

module.exports = router;
