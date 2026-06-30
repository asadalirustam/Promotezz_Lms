const FeeChallan = require('../models/FeeChallan');
const Payment = require('../models/Payment');
const Scholarship = require('../models/Scholarship');
const Discount = require('../models/Discount');
const Fine = require('../models/Fine');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const User = require('../models/User');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const students = await User.countDocuments({ role: 'student' });

    const challans = await FeeChallan.find({});
    const paidChallans = challans.filter(c => c.status === 'paid').length;
    const unpaidChallans = challans.filter(c => c.status === 'unpaid' || c.status === 'overdue').length;
    const partialChallans = challans.filter(c => c.status === 'partial').length;

    const totalRevenue = challans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const pendingRevenue = challans.reduce((sum, c) => sum + Math.max(0, (c.netPayable || 0) - (c.paidAmount || 0)), 0);

    const scholarships = await Scholarship.countDocuments({ status: { $in: ['approved', 'active'] } });
    const scholarshipTotal = await Scholarship.aggregate([
      { $match: { status: { $in: ['approved', 'active'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const discounts = await Discount.countDocuments({ isActive: true });
    const finesCollected = await Fine.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Monthly income (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIncome = await Payment.aggregate([
      { $match: { paidDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Today's collection
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCollection = await Payment.aggregate([
      { $match: { paidDate: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents: students,
        paidStudents: paidChallans,
        unpaidStudents: unpaidChallans,
        partialPaidStudents: partialChallans,
        totalRevenue,
        pendingRevenue,
        scholarships,
        scholarshipTotal: scholarshipTotal[0]?.total || 0,
        discounts,
        finesCollected: finesCollected[0]?.total || 0,
        monthlyIncome: monthlyIncome[0]?.total || 0,
        todayCollection: todayCollection[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats' });
  }
};

// ─── Monthly Revenue Chart ────────────────────────────────────────────────────
const getMonthlyRevenue = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const monthly = await Payment.aggregate([
      {
        $match: {
          paidDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$paidDate' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map((name, idx) => {
      const found = monthly.find(m => m._id === idx + 1);
      return { name, revenue: found?.total || 0, transactions: found?.count || 0 };
    });

    res.json({ success: true, data: chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching monthly revenue' });
  }
};

// ─── AI Revenue Prediction ────────────────────────────────────────────────────
const getAIPrediction = async (req, res) => {
  try {
    const now = new Date();
    const last6Months = await Payment.aggregate([
      {
        $match: {
          paidDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const avgMonthly = last6Months.length > 0
      ? last6Months.reduce((s, m) => s + m.total, 0) / last6Months.length
      : 0;

    const totalStudents = await User.countDocuments({ role: 'student' });
    const unpaidChallans = await FeeChallan.find({ status: { $in: ['unpaid', 'partial', 'overdue'] } });
    const expectedCollection = unpaidChallans.reduce((sum, c) => sum + Math.max(0, (c.netPayable || 0) - (c.paidAmount || 0)), 0);
    const highRiskCount = unpaidChallans.filter(c => c.status === 'overdue').length;

    // Expense trend
    const expenses = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        predictedMonthlyRevenue: Math.round(avgMonthly * 1.05),
        predictedSemesterRevenue: Math.round(avgMonthly * 1.05 * 6),
        predictedYearlyRevenue: Math.round(avgMonthly * 1.05 * 12),
        expectedCollection,
        highRiskAccounts: highRiskCount,
        totalAtRisk: unpaidChallans.length,
        topExpenseCategories: expenses.slice(0, 5),
        budgetOptimizationTip: expenses.length > 0
          ? `Highest expense category is "${expenses[0]._id}" at PKR ${expenses[0].total.toLocaleString()}. Consider reviewing this budget allocation.`
          : 'Insufficient expense data for analysis.',
        studentCount: totalStudents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error generating AI prediction' });
  }
};

// ─── Generate Reports ─────────────────────────────────────────────────────────
const getFinanceReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let reportData = {};

    if (type === 'fee_collection' || type === 'all') {
      const payments = await Payment.find(
        startDate || endDate ? { paidDate: dateFilter } : {}
      ).populate('student', 'name email department semester').lean();
      reportData.feeCollection = payments;
    }

    if (type === 'pending_fees' || type === 'all') {
      const pending = await FeeChallan.find({ status: { $in: ['unpaid', 'partial', 'overdue'] } })
        .populate('student', 'name email department semester').lean();
      reportData.pendingFees = pending;
    }

    if (type === 'scholarships' || type === 'all') {
      const scholarships = await Scholarship.find({})
        .populate('student', 'name email department').lean();
      reportData.scholarships = scholarships;
    }

    if (type === 'expenses' || type === 'all') {
      const expenses = await Expense.find(
        startDate || endDate ? { date: dateFilter } : {}
      ).populate('recordedBy', 'name').lean();
      reportData.expenses = expenses;
    }

    if (type === 'salaries' || type === 'all') {
      const salaries = await Salary.find({})
        .populate('employee', 'name email role department').lean();
      reportData.salaries = salaries;
    }

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error generating report' });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyRevenue,
  getAIPrediction,
  getFinanceReport
};
