const express = require('express');
const router = express.Router();
const { getUsers, getTeachers, getContacts, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'hod'), getUsers)
  .post(authorize('admin'), createUser);

router.get('/teachers', getTeachers);
router.get('/contacts', getContacts);

router.route('/:id')
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;
