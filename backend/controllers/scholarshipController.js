const Scholarship = require('../models/Scholarship');
const Discount = require('../models/Discount');
const User = require('../models/User');

// ─── Scholarship CRUD ─────────────────────────────────────────────────────────
const getScholarships = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    let scholarships = await Scholarship.find(filter)
      .populate('student', 'name email department semester')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    if (search) {
      scholarships = scholarships.filter(s =>
        s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.title?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Scholarship.countDocuments(filter);
    res.json({ success: true, data: scholarships, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching scholarships' });
  }
};

const createScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.create(req.body);
    const populated = await scholarship.populate('student', 'name email department');
    res.status(201).json({ success: true, data: populated, message: 'Scholarship created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('student', 'name email department');
    if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found' });
    res.json({ success: true, data: scholarship, message: 'Scholarship updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
    if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found' });
    res.json({ success: true, message: 'Scholarship deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting scholarship' });
  }
};

const approveScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedDate: new Date() },
      { new: true }
    ).populate('student', 'name email department');
    if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found' });
    res.json({ success: true, data: scholarship, message: 'Scholarship approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving scholarship' });
  }
};

const rejectScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: req.body.reason || 'Not eligible' },
      { new: true }
    ).populate('student', 'name email department');
    if (!scholarship) return res.status(404).json({ success: false, message: 'Scholarship not found' });
    res.json({ success: true, data: scholarship, message: 'Scholarship rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting scholarship' });
  }
};

// ─── Discount CRUD ─────────────────────────────────────────────────────────────
const getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({})
      .populate('student', 'name email department')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching discounts' });
  }
};

const createDiscount = async (req, res) => {
  try {
    const discount = await Discount.create({ ...req.body, createdBy: req.user._id });
    const populated = await discount.populate('student', 'name email department');
    res.status(201).json({ success: true, data: populated, message: 'Discount created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!discount) return res.status(404).json({ success: false, message: 'Discount not found' });
    res.json({ success: true, data: discount, message: 'Discount updated' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteDiscount = async (req, res) => {
  try {
    await Discount.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Discount deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting discount' });
  }
};

module.exports = {
  getScholarships, createScholarship, updateScholarship, deleteScholarship,
  approveScholarship, rejectScholarship,
  getDiscounts, createDiscount, updateDiscount, deleteDiscount
};
