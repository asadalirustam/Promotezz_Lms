const express = require('express');
const router = express.Router();
const { uploadResource, getCourseResources, deleteResource, getResources } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'teacher', 'hod'), upload.single('file'), uploadResource)
  .get(getResources);

router.get('/course/:courseId', getCourseResources);

router.route('/:id')
  .delete(authorize('admin', 'teacher', 'hod'), deleteResource);

module.exports = router;
