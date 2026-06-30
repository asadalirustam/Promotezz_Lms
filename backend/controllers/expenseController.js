const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const User = require('../models/User');
const PDFDocument = require('pdfkit');

// ─── Expense CRUD ─────────────────────────────────────────────────────────────
const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('recordedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(filter);

    const summary = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: expenses, total, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching expenses' });
  }
};

const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, recordedBy: req.user._id });
    res.status(201).json({ success: true, data: expense, message: 'Expense recorded successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense, message: 'Expense updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting expense' });
  }
};

// ─── Salary Management ─────────────────────────────────────────────────────────
const getSalaries = async (req, res) => {
  try {
    const { month, year, status, employeeId } = req.query;
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const salaries = await Salary.find(filter)
      .populate('employee', 'name email role department')
      .populate('generatedBy', 'name')
      .sort({ year: -1, month: -1 });

    const total = await Salary.countDocuments(filter);
    res.json({ success: true, data: salaries, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching salaries' });
  }
};

const generateSalarySlip = async (req, res) => {
  try {
    const {
      employeeId, month, year, basicSalary, allowances = [],
      deductions = [], bonus = 0, overtimeHours = 0, taxRate = 0,
      paymentMethod = 'bank_transfer', bankAccount = '', notes = ''
    } = req.body;

    if (!employeeId || !month || !year || !basicSalary) {
      return res.status(400).json({ success: false, message: 'employeeId, month, year, and basicSalary are required' });
    }

    const existing = await Salary.findOne({ employee: employeeId, month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Salary slip already generated for this month' });
    }

    const overtime = overtimeHours * ((basicSalary / 30) / 8);
    const taxAmount = (basicSalary * taxRate) / 100;
    const slipNumber = `SAL-${year}-${String(month).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    const salary = await Salary.create({
      employee: employeeId, month, year, basicSalary,
      allowances, deductions, bonus, overtime, overtimeHours,
      taxAmount, taxRate, paymentMethod, bankAccount, notes, slipNumber,
      generatedBy: req.user._id
    });

    const populated = await salary.populate('employee', 'name email role department');
    res.status(201).json({ success: true, data: populated, message: 'Salary slip generated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('employee', 'name email role department');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });
    res.json({ success: true, data: salary, message: 'Salary updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const downloadSalarySlip = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('employee', 'name email role department')
      .populate('generatedBy', 'name');

    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Salary-${salary.slipNumber}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 612, 90).fill('#0F172A');
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text('AI DEPARTMENT LMS', 50, 20);
    doc.fontSize(12).font('Helvetica').text('Salary Slip', 50, 48);
    doc.fillColor('white').fontSize(10).text(`Slip No: ${salary.slipNumber}`, 400, 20, { align: 'right' });
    doc.fillColor('white').fontSize(10).text(`${months[salary.month - 1]} ${salary.year}`, 400, 38, { align: 'right' });

    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Employee Information', 50, 105);
    doc.moveTo(50, 122).lineTo(562, 122).stroke('#E2E8F0');

    let y = 132;
    const empInfo = [
      ['Name', salary.employee?.name],
      ['Email', salary.employee?.email],
      ['Department', salary.employee?.department],
      ['Designation', salary.employee?.role?.toUpperCase()],
      ['Payment Method', salary.paymentMethod?.replace('_', ' ').toUpperCase()]
    ];
    doc.fontSize(10).font('Helvetica');
    empInfo.forEach(([label, value]) => {
      doc.fillColor('#64748B').text(label + ':', 50, y);
      doc.fillColor('#0F172A').text(value || 'N/A', 200, y);
      y += 18;
    });

    y += 10;
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Earnings', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(562, y).stroke('#E2E8F0');
    y += 10;
    doc.fontSize(10).font('Helvetica');
    doc.fillColor('#64748B').text('Basic Salary:', 50, y);
    doc.fillColor('#0F172A').text(`PKR ${salary.basicSalary?.toLocaleString()}`, 200, y);
    y += 16;
    salary.allowances?.forEach(a => {
      doc.fillColor('#64748B').text(a.title + ':', 50, y);
      doc.fillColor('#10B981').text(`+ PKR ${a.amount?.toLocaleString()}`, 200, y);
      y += 16;
    });
    if (salary.bonus > 0) { doc.fillColor('#64748B').text('Bonus:', 50, y); doc.fillColor('#10B981').text(`+ PKR ${salary.bonus?.toLocaleString()}`, 200, y); y += 16; }
    if (salary.overtime > 0) { doc.fillColor('#64748B').text('Overtime:', 50, y); doc.fillColor('#10B981').text(`+ PKR ${salary.overtime?.toFixed(0)}`, 200, y); y += 16; }

    y += 8;
    doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('Deductions', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(562, y).stroke('#E2E8F0');
    y += 10;
    doc.fontSize(10).font('Helvetica');
    salary.deductions?.forEach(d => {
      doc.fillColor('#64748B').text(d.title + ':', 50, y);
      doc.fillColor('#EF4444').text(`- PKR ${d.amount?.toLocaleString()}`, 200, y);
      y += 16;
    });
    if (salary.taxAmount > 0) {
      doc.fillColor('#64748B').text(`Tax (${salary.taxRate}%):`, 50, y);
      doc.fillColor('#EF4444').text(`- PKR ${salary.taxAmount?.toLocaleString()}`, 200, y);
      y += 16;
    }

    y += 12;
    doc.rect(50, y, 512, 50).fill('#EFF6FF');
    doc.fillColor('#2563EB').fontSize(14).font('Helvetica-Bold').text('Gross Salary:', 70, y + 8);
    doc.fillColor('#2563EB').text(`PKR ${salary.grossSalary?.toLocaleString()}`, 350, y + 8);
    doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Net Salary:', 70, y + 28);
    doc.fillColor('#0F172A').text(`PKR ${salary.netSalary?.toLocaleString()}`, 350, y + 28);

    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(
      'This is a computer generated salary slip. No signature required.',
      50, 750, { align: 'center', width: 512 }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating salary slip' });
  }
};

module.exports = {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getSalaries, generateSalarySlip, updateSalary, downloadSalarySlip
};
