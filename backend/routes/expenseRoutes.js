const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getSalaries, generateSalarySlip, updateSalary, downloadSalarySlip
} = require('../controllers/expenseController');

const canAccess = ['admin', 'accountant'];

// Expenses
router.get('/expenses', protect, authorize(...canAccess), getExpenses);
router.post('/expenses', protect, authorize(...canAccess), createExpense);
router.put('/expenses/:id', protect, authorize(...canAccess), updateExpense);
router.delete('/expenses/:id', protect, authorize(...canAccess), deleteExpense);

// Salaries
router.get('/salaries', protect, authorize(...canAccess), getSalaries);
router.post('/salaries/generate', protect, authorize(...canAccess), generateSalarySlip);
router.put('/salaries/:id', protect, authorize(...canAccess), updateSalary);
router.get('/salaries/:id/slip', protect, authorize(...canAccess), downloadSalarySlip);

module.exports = router;
