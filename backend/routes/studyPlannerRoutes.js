const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  generatePlan,
  getPlan,
  customizePlan
} = require('../controllers/studyPlannerController');

router.post('/generate', protect, authorize('student'), generatePlan);
router.get('/current', protect, authorize('student'), getPlan);
router.put('/customize', protect, authorize('student'), customizePlan);

module.exports = router;
