const FeeStructure = require('../models/FeeStructure');
const FeeChallan = require('../models/FeeChallan');
const Payment = require('../models/Payment');
const Fine = require('../models/Fine');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// ─── Utility: Generate IDs ────────────────────────────────────────────────────
const generateChallanNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  return `CHN-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  return `RCP-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

// ─── Fee Structure CRUD ───────────────────────────────────────────────────────
const getFeeStructures = async (req, res) => {
  try {
    const { department, semester, isActive } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const structures = await FeeStructure.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fee structures' });
  }
};

const createFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: structure, message: 'Fee structure created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    res.json({ success: true, data: structure, message: 'Fee structure updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found' });
    res.json({ success: true, message: 'Fee structure deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting fee structure' });
  }
};

// ─── Challan Management ───────────────────────────────────────────────────────
const getChallans = async (req, res) => {
  try {
    const { status, department, semester, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);

    let challans = await FeeChallan.find(filter)
      .populate('student', 'name email department semester')
      .populate('feeStructure', 'name')
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    if (search) {
      challans = challans.filter(c =>
        c.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.challanNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await FeeChallan.countDocuments(filter);
    res.json({ success: true, data: challans, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching challans' });
  }
};

const generateChallan = async (req, res) => {
  try {
    const { studentId, feeStructureId, dueDate, isInstallment, installments, notes } = req.body;
    if (!studentId || !dueDate) {
      return res.status(400).json({ success: false, message: 'studentId and dueDate are required' });
    }

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let totalAmount = req.body.totalAmount || 0;
    let feeStructure = null;

    if (feeStructureId) {
      feeStructure = await FeeStructure.findById(feeStructureId);
      if (feeStructure) {
        totalAmount = feeStructure.tuitionFee + feeStructure.semesterFee +
          feeStructure.labFee + feeStructure.libraryFee + feeStructure.hostelFee +
          feeStructure.transportFee + feeStructure.examinationFee + feeStructure.miscellaneousFee +
          (feeStructure.creditHourRate * feeStructure.totalCredits);
      }
    }

    const discountAmount = req.body.discountAmount || 0;
    const scholarshipAmount = req.body.scholarshipAmount || 0;
    const fineAmount = req.body.fineAmount || 0;
    const netPayable = totalAmount - discountAmount - scholarshipAmount + fineAmount;

    const challan = await FeeChallan.create({
      challanNumber: generateChallanNumber(),
      student: studentId,
      feeStructure: feeStructureId || undefined,
      department: student.department || 'AI',
      semester: student.semester || req.body.semester || 1,
      academicYear: req.body.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      totalAmount,
      paidAmount: 0,
      discountAmount,
      scholarshipAmount,
      fineAmount,
      netPayable,
      dueDate: new Date(dueDate),
      status: 'unpaid',
      isInstallment: isInstallment || false,
      installments: installments || [],
      notes: notes || '',
      generatedBy: req.user._id
    });

    const populated = await challan.populate('student', 'name email department semester');
    res.status(201).json({ success: true, data: populated, message: 'Fee challan generated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getChallanById = async (req, res) => {
  try {
    const challan = await FeeChallan.findById(req.params.id)
      .populate('student', 'name email department semester')
      .populate('feeStructure')
      .populate('generatedBy', 'name');
    if (!challan) return res.status(404).json({ success: false, message: 'Challan not found' });
    res.json({ success: true, data: challan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching challan' });
  }
};

// ─── Payment Collection ───────────────────────────────────────────────────────
const collectPayment = async (req, res) => {
  try {
    const { challanId, amount, paymentMethod, transactionId, bankName, notes } = req.body;
    if (!challanId || !amount || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'challanId, amount, and paymentMethod are required' });
    }

    const challan = await FeeChallan.findById(challanId);
    if (!challan) return res.status(404).json({ success: false, message: 'Challan not found' });
    if (challan.status === 'paid') return res.status(400).json({ success: false, message: 'Challan is already fully paid' });

    challan.paidAmount += parseFloat(amount);
    challan.paymentMethod = paymentMethod;
    if (challan.paidAmount >= challan.netPayable) {
      challan.status = 'paid';
      challan.paidDate = new Date();
    } else {
      challan.status = 'partial';
    }

    await challan.save();

    const remainingBalance = Math.max(0, challan.netPayable - challan.paidAmount);
    const payment = await Payment.create({
      receiptNumber: generateReceiptNumber(),
      challan: challanId,
      student: challan.student,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId: transactionId || '',
      bankName: bankName || '',
      paidDate: new Date(),
      remainingBalance,
      collectedBy: req.user._id,
      notes: notes || ''
    });

    const populated = await payment.populate([
      { path: 'student', select: 'name email department semester' },
      { path: 'collectedBy', select: 'name' }
    ]);

    res.status(201).json({ success: true, data: { payment: populated, challan }, message: 'Payment collected successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const { paymentMethod, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.paidDate = {};
      if (startDate) filter.paidDate.$gte = new Date(startDate);
      if (endDate) filter.paidDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('student', 'name email department semester')
      .populate('collectedBy', 'name')
      .sort({ paidDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(filter);
    res.json({ success: true, data: payments, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payments' });
  }
};

// ─── Receipt PDF Download ─────────────────────────────────────────────────────
const downloadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email department semester')
      .populate('challan')
      .populate('collectedBy', 'name');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${payment.receiptNumber}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, 612, 90).fill('#2563EB');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('AI DEPARTMENT LMS', 50, 25);
    doc.fontSize(11).font('Helvetica').text('Fee Payment Receipt', 50, 52);
    doc.fillColor('white').fontSize(10).text(`Receipt No: ${payment.receiptNumber}`, 400, 25, { align: 'right' });
    doc.fillColor('white').fontSize(10).text(`Date: ${new Date(payment.paidDate).toLocaleDateString('en-PK')}`, 400, 42, { align: 'right' });

    // Student Info
    doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Student Information', 50, 110);
    doc.moveTo(50, 128).lineTo(562, 128).stroke('#E2E8F0');
    doc.fontSize(11).font('Helvetica');
    const info = [
      ['Student Name', payment.student?.name || 'N/A'],
      ['Email', payment.student?.email || 'N/A'],
      ['Department', payment.student?.department || 'N/A'],
      ['Semester', payment.student?.semester || 'N/A'],
    ];
    let y = 138;
    info.forEach(([label, value]) => {
      doc.fillColor('#64748B').text(label + ':', 50, y);
      doc.fillColor('#0F172A').text(value?.toString(), 200, y);
      y += 20;
    });

    // Payment Details
    doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Payment Details', 50, y + 15);
    y += 30;
    doc.moveTo(50, y + 5).lineTo(562, y + 5).stroke('#E2E8F0');
    y += 15;
    const payDetails = [
      ['Amount Paid', `PKR ${payment.amount?.toLocaleString()}`],
      ['Payment Method', payment.paymentMethod?.replace('_', ' ').toUpperCase()],
      ['Transaction ID', payment.transactionId || 'N/A'],
      ['Remaining Balance', `PKR ${payment.remainingBalance?.toLocaleString()}`],
      ['Collected By', payment.collectedBy?.name || 'N/A'],
    ];
    doc.fontSize(11).font('Helvetica');
    payDetails.forEach(([label, value]) => {
      doc.fillColor('#64748B').text(label + ':', 50, y);
      doc.fillColor('#0F172A').text(value?.toString(), 200, y);
      y += 20;
    });

    // Total box
    y += 10;
    doc.rect(50, y, 512, 45).fill('#EFF6FF');
    doc.fillColor('#2563EB').fontSize(16).font('Helvetica-Bold').text(`Total Paid: PKR ${payment.amount?.toLocaleString()}`, 60, y + 13);

    // Footer
    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(
      'This is a computer generated receipt. No signature required.',
      50, 750, { align: 'center', width: 512 }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating receipt' });
  }
};

// ─── Fine Management ──────────────────────────────────────────────────────────
const getFines = async (req, res) => {
  try {
    const fines = await Fine.find({})
      .populate('student', 'name email department semester')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: fines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fines' });
  }
};

const createFine = async (req, res) => {
  try {
    const fine = await Fine.create({ ...req.body, issuedBy: req.user._id });
    res.status(201).json({ success: true, data: fine, message: 'Fine created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateFine = async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(req.params.id, { ...req.body, adjustedBy: req.user._id }, { new: true });
    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found' });
    res.json({ success: true, data: fine, message: 'Fine updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── Student Ledger ───────────────────────────────────────────────────────────
const getStudentLedger = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select('name email department semester');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const challans = await FeeChallan.find({ student: studentId }).sort({ createdAt: -1 });
    const payments = await Payment.find({ student: studentId }).sort({ paidDate: -1 });
    const fines = await Fine.find({ student: studentId }).sort({ createdAt: -1 });

    const totalDue = challans.reduce((sum, c) => sum + (c.netPayable || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstandingBalance = totalDue - totalPaid;

    res.json({
      success: true,
      data: { student, challans, payments, fines, totalDue, totalPaid, outstandingBalance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching student ledger' });
  }
};

module.exports = {
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
  getChallans, generateChallan, getChallanById,
  collectPayment, getPayments, downloadReceipt,
  getFines, createFine, updateFine,
  getStudentLedger
};
