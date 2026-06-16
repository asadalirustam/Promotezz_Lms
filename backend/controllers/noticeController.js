const Notice = require('../models/Notice');

// @desc    Create new notice announcement
// @route   POST /api/notices
// @access  Private (Teacher/Admin/HOD)
const createNotice = async (req, res) => {
  try {
    const { title, content, pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide title and content' });
    }

    const notice = await Notice.create({
      title,
      content,
      pinned: pinned || false,
      author: req.user.id
    });

    const populatedNotice = await Notice.findById(notice._id).populate('author', 'name role');

    res.status(201).json({ success: true, data: populatedNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({})
      .sort({ pinned: -1, createdAt: -1 })
      .populate('author', 'name role');

    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Teacher/Admin/HOD)
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Auth check: Admin/HOD can delete any, Teacher can delete their own
    if (req.user.role === 'teacher' && notice.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this notice' });
    }

    await notice.deleteOne();
    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotice,
  getNotices,
  deleteNotice
};
