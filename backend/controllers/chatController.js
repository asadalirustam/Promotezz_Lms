const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

const cleanJson = (text) => {
  let cleaned = text.trim();
  const firstBracket = cleaned.indexOf('{');
  const lastBracket = cleaned.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned.trim();
};

// 1. Create or retrieve room between two users
const createOrGetRoom = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    const myId = req.user._id;

    // Search room where both myId and recipientId are present in participants
    let room = await ChatRoom.findOne({
      participants: { $all: [myId, recipientId] }
    }).populate('participants', 'name email role');

    if (!room) {
      room = await ChatRoom.create({
        participants: [myId, recipientId]
      });
      room = await room.populate('participants', 'name email role');
    }

    res.status(200).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Fetch all rooms for active user
const getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user._id
    })
      .populate('participants', 'name email role profileImage')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Send Message in Room
const sendMessage = async (req, res) => {
  try {
    const { roomId, text, translateToLanguage } = req.body;
    if (!roomId) {
      return res.status(400).json({ success: false, message: 'Room ID is required' });
    }

    let fileUrl = '';
    let fileType = 'text';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        fileType = 'image';
      } else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
        fileType = 'voice';
      } else {
        fileType = 'document';
      }
    }

    if (!text && !fileUrl) {
      return res.status(400).json({ success: false, message: 'Cannot send an empty message' });
    }

    let translatedText = '';
    // Optional translation via Gemini if specified
    if (text && translateToLanguage) {
      const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `Translate this message exactly to ${translateToLanguage}. Output ONLY the translated text: "${text}"`;
          const result = await model.generateContent(prompt);
          translatedText = result.response.text().trim();
        } catch (e) {
          console.error('AI translation failed', e);
        }
      }
    }

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      text: text || '',
      fileUrl,
      fileType,
      translatedText
    });

    // Touch ChatRoom to update timestamp
    await ChatRoom.findByIdAndUpdate(roomId, { updatedAt: Date.now() });

    // Award Gamification XP for sending constructive messages (+2 XP)
    const sender = await User.findById(req.user._id);
    if (sender) {
      sender.xp += 2;
      await sender.save();
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Fetch Messages in Room
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Generate Room AI insights (Summary, Action Items, Reply suggestions)
const getRoomAiInsights = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await ChatRoom.findById(roomId).populate('participants', 'name role');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Fetch the last 15 messages for history context
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(15);

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          aiSummary: 'No messages exchanged yet.',
          aiActionItems: [],
          replySuggestions: ['Hello! How can I help you?', 'Let me review the portal details.']
        }
      });
    }

    // reverse history to chronological
    const historyText = messages.reverse().map(m => `${m.sender?.name} (${m.sender?.role}): ${m.text || '[Attachment]'}`).join('\n');

    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    let insights = null;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Below is a chat history between a teacher and a student.
Provide insights as a JSON object with this exact structure:
{
  "aiSummary": "1-2 sentence overview of the conversation topic.",
  "aiActionItems": ["action item for student or teacher 1", "action item 2"],
  "replySuggestions": ["suggested reply option 1", "suggested reply option 2"]
}

Chat History:
${historyText}

Only output raw valid JSON.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      try {
        const cleaned = cleanJson(responseText);
        insights = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse chat insights:', responseText, parseErr);
      }
    }

    if (!insights) {
      // Mock Fallback
      insights = {
        aiSummary: 'Discussion regarding assignment criteria and grading checklist.',
        aiActionItems: [
          'Student needs to submit the PDF assignment by Wednesday.',
          'Teacher will review the formatting specifications.'
        ],
        replySuggestions: [
          'Yes, I will submit it on time.',
          'Can you clarify the guidelines?',
          'Okay, thank you!'
        ]
      };
    }

    // Cache insights on the ChatRoom document
    room.aiSummary = insights.aiSummary;
    room.aiActionItems = insights.aiActionItems;
    await room.save();

    res.status(200).json({ success: true, data: { ...insights } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrGetRoom,
  getRooms,
  sendMessage,
  getMessages,
  getRoomAiInsights
};
