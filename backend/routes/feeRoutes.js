const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getChallans, generateChallan, getChallanById,
  collectPayment, getPayments, downloadReceipt,
  getFines, createFine, updateFine,
  getStudentLedger
} = require('../controllers/feeController');

const canAccess = ['admin', 'accountant'];

// Fee Structures
router.get('/structures', protect, authorize(...canAccess), getFeeStructures);
router.post('/structures', protect, authorize(...canAccess), createFeeStructure);
router.put('/structures/:id', protect, authorize(...canAccess), updateFeeStructure);
router.delete('/structures/:id', protect, authorize(...canAccess), deleteFeeStructure);

// Challans
router.get('/challans', protect, authorize(...canAccess), getChallans);
router.get('/challans/:id', protect, authorize(...canAccess), getChallanById);
router.post('/challans/generate', protect, authorize(...canAccess), generateChallan);

// Payments
router.get('/payments', protect, authorize(...canAccess), getPayments);
router.post('/payments/collect', protect, authorize(...canAccess), collectPayment);
router.get('/payments/:id/receipt', protect, authorize(...canAccess), downloadReceipt);

// Fines
router.get('/fines', protect, authorize(...canAccess), getFines);
router.post('/fines', protect, authorize(...canAccess), createFine);
router.put('/fines/:id', protect, authorize(...canAccess), updateFine);

// Student Ledger
router.get('/ledger/:studentId', protect, authorize(...canAccess), getStudentLedger);

module.exports = router;
