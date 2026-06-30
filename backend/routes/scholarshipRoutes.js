const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getScholarships, createScholarship, updateScholarship, deleteScholarship,
  approveScholarship, rejectScholarship,
  getDiscounts, createDiscount, updateDiscount, deleteDiscount
} = require('../controllers/scholarshipController');

const canAccess = ['admin', 'accountant'];

// Scholarships
router.get('/', protect, authorize(...canAccess), getScholarships);
router.post('/', protect, authorize(...canAccess), createScholarship);
router.put('/:id', protect, authorize(...canAccess), updateScholarship);
router.delete('/:id', protect, authorize(...canAccess), deleteScholarship);
router.patch('/:id/approve', protect, authorize(...canAccess), approveScholarship);
router.patch('/:id/reject', protect, authorize(...canAccess), rejectScholarship);

// Discounts
router.get('/discounts', protect, authorize(...canAccess), getDiscounts);
router.post('/discounts', protect, authorize(...canAccess), createDiscount);
router.put('/discounts/:id', protect, authorize(...canAccess), updateDiscount);
router.delete('/discounts/:id', protect, authorize(...canAccess), deleteDiscount);

module.exports = router;
