const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createOrGetRoom,
  getRooms,
  sendMessage,
  getMessages,
  getRoomAiInsights
} = require('../controllers/chatController');

router.post('/rooms', protect, createOrGetRoom);
router.get('/rooms', protect, getRooms);
router.post('/rooms/message', protect, upload.single('chatAttachment'), sendMessage);
router.get('/rooms/:roomId/messages', protect, getMessages);
router.get('/rooms/:roomId/ai-insights', protect, getRoomAiInsights);

module.exports = router;
