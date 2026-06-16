const express = require('express');
const router = express.Router();
const { createNotice, getNotices, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'teacher', 'hod'), createNotice)
  .get(getNotices);

router.route('/:id')
  .delete(authorize('admin', 'teacher', 'hod'), deleteNotice);

module.exports = router;
