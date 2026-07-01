const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const Attendance = require('../models/Attendance');
const Resource = require('../models/Resource');
const GeneratedPaper = require('../models/GeneratedPaper');
const FeeChallan = require('../models/FeeChallan');


// @desc    Get dashboard statistics for Students
// @route   GET /api/analytics/student
// @access  Private (Student)
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get enrollments
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');
    const courseIds = enrollments.map(e => e.course._id);

    // Calculate GPA
    const gradedEnrollments = enrollments.filter(e => e.gradePoints !== undefined && e.status === 'completed');
    const gpa = gradedEnrollments.length > 0
      ? (gradedEnrollments.reduce((acc, curr) => acc + curr.gradePoints, 0) / gradedEnrollments.length).toFixed(2)
      : '3.50'; // Default mockup GPA for demo if not graded yet

    // Total Assignments
    const totalAssignments = await Assignment.countDocuments({ course: { $in: courseIds } });

    // Completed Submissions
    const completedSubmissions = await Submission.countDocuments({ student: studentId });

    // Upcoming assignments (not yet submitted, due in the future)
    const submittedAssignIds = await Submission.find({ student: studentId }).distinct('assignment');
    const upcomingAssignments = await Assignment.find({
      course: { $in: courseIds },
      _id: { $nin: submittedAssignIds },
      dueDate: { $gte: new Date() }
    }).populate('course', 'name code').limit(5);

    // Attendance logs for heatmap
    const allAttendance = await Attendance.find({}).populate('course');
    const attendanceHeatmap = [];
    let totalClasses = 0;
    let presentCount = 0;
    let lateCount = 0;

    allAttendance.forEach(log => {
      const record = log.records.find(r => r.student.toString() === studentId);
      if (record) {
        totalClasses++;
        if (record.status === 'present') presentCount++;
        else if (record.status === 'late') lateCount++;

        attendanceHeatmap.push({
          date: log.date.toISOString().slice(0, 10),
          status: record.status,
          course: log.course?.name || 'Class'
        });
      }
    });

    const attendanceRate = totalClasses > 0
      ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100)
      : 85;

    // Quiz Performance
    const quizResults = await QuizResult.find({ student: studentId }).populate('quiz');
    const quizPerformance = quizResults.map(qr => ({
      title: qr.quiz?.title || 'Quiz',
      score: qr.score,
      totalQuestions: qr.totalQuestions,
      percentage: qr.totalQuestions > 0 ? Math.round((qr.score / qr.totalQuestions) * 100) : 0,
      date: qr.createdAt
    }));

    // Assignment Performance
    const submissionHistory = await Submission.find({ student: studentId }).populate('assignment');
    const assignmentPerformance = submissionHistory.map(sh => ({
      title: sh.assignment?.title || 'Assignment',
      grade: sh.grade || 0,
      status: sh.status,
      date: sh.submittedAt
    }));

    // Subject Performance
    const subjectPerformance = [];
    for (const e of enrollments) {
      const courseSubmissions = submissionHistory.filter(s => s.assignment?.course.toString() === e.course._id.toString() && s.grade !== undefined);
      const avgGrade = courseSubmissions.length > 0
        ? courseSubmissions.reduce((acc, curr) => acc + curr.grade, 0) / courseSubmissions.length
        : 80;

      subjectPerformance.push({
        courseName: e.course.name,
        courseCode: e.course.code,
        score: Math.round(avgGrade)
      });
    }

    // Calculate average grade score from submissions and quizzes
    let totalScore = 0;
    let scoreCount = 0;
    submissionHistory.forEach(s => {
      if (s.grade !== undefined) {
        totalScore += s.grade;
        scoreCount++;
      }
    });
    quizResults.forEach(q => {
      if (q.score !== undefined && q.totalQuestions) {
        totalScore += (q.score / q.totalQuestions) * 100;
        scoreCount++;
      }
    });
    const averagePercentage = scoreCount > 0 ? totalScore / scoreCount : 85;

    // Monthly Progress (mocked array of last 6 months based on grading milestones)
    const monthlyProgress = [
      { month: 'Jan', score: 78 },
      { month: 'Feb', score: 81 },
      { month: 'Mar', score: 85 },
      { month: 'Apr', score: 83 },
      { month: 'May', score: 88 },
      { month: 'Jun', score: Math.round(averagePercentage) }
    ];

    res.status(200).json({
      success: true,
      data: {
        totalCourses: enrollments.length,
        gpa,
        totalAssignments,
        completedSubmissions,
        attendanceRate,
        upcomingAssignments,
        attendanceHeatmap,
        quizPerformance,
        assignmentPerformance,
        subjectPerformance,
        monthlyProgress
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics for Teachers
// @route   GET /api/analytics/teacher
// @access  Private (Teacher)
const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Courses taught by teacher
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);

    // Total Students enrolled
    const studentEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });

    // Total Assignments created
    const assignmentsCreated = await Assignment.countDocuments({ course: { $in: courseIds } });

    // Submissions pending review (status is 'submitted')
    const pendingSubmissions = await Submission.countDocuments({
      assignment: { $in: await Assignment.find({ course: { $in: courseIds } }).distinct('_id') },
      status: 'submitted'
    });

    // Recent ungraded submissions list
    const recentSubmissions = await Submission.find({
      assignment: { $in: await Assignment.find({ course: { $in: courseIds } }).distinct('_id') },
      status: 'submitted'
    })
      .populate('student', 'name email')
      .populate('assignment', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents: studentEnrollments,
        totalAssignments: assignmentsCreated,
        pendingSubmissions,
        recentSubmissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics for HOD
// @route   GET /api/analytics/hod
// @access  Private (HOD)
const getHODStats = async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments({});

    // GPA distribution chart data (group students by grade ranges)
    const enrollments = await Enrollment.find({});
    let gpaSum = 0;
    let gpaCount = 0;
    enrollments.forEach(e => {
      if (e.gradePoints) {
        gpaSum += e.gradePoints;
        gpaCount++;
      }
    });
    const avgGPA = gpaCount > 0 ? (gpaSum / gpaCount).toFixed(2) : '3.40';

    // Department overall attendance rate
    const logs = await Attendance.find({});
    let totalRecords = 0;
    let presentCount = 0;
    logs.forEach(log => {
      log.records.forEach(r => {
        totalRecords++;
        if (r.status === 'present' || r.status === 'late') {
          presentCount++;
        }
      });
    });
    const deptAttendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 92;

    // At-Risk Student identification (attendance < 75% or GPA < 2.5)
    // We fetch students and query their GPA and attendance
    const students = await User.find({ role: 'student' }).select('name email semester');
    const atRiskList = [];

    for (let student of students) {
      const studentEnroll = await Enrollment.find({ student: student._id });
      let stdGPASum = 0;
      let stdGPACount = 0;
      studentEnroll.forEach(se => {
        if (se.gradePoints) {
          stdGPASum += se.gradePoints;
          stdGPACount++;
        }
      });
      const stdGPA = stdGPACount > 0 ? stdGPASum / stdGPACount : 3.5; // fallback to safe default

      // Attendance
      const stdLogs = await Attendance.find({ 'records.student': student._id });
      let stdTotal = 0;
      let stdPres = 0;
      stdLogs.forEach(l => {
        const record = l.records.find(r => r.student.toString() === student._id.toString());
        if (record) {
          stdTotal++;
          if (record.status === 'present') stdPres++;
        }
      });
      const stdAttendance = stdTotal > 0 ? (stdPres / stdTotal) * 100 : 85;

      if (stdGPA < 2.5 || stdAttendance < 75) {
        atRiskList.push({
          _id: student._id,
          name: student.name,
          email: student.email,
          semester: student.semester,
          gpa: stdGPA.toFixed(2),
          attendance: Math.round(stdAttendance)
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        totalStudents,
        totalCourses,
        avgGPA,
        deptAttendance,
        atRiskStudents: atRiskList.slice(0, 10) // Limit to top 10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics for Admin
// @route   GET /api/analytics/admin
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    // ── Core counts ───────────────────────────────────────────────────
    const totalUsers       = await User.countDocuments({});
    const studentCount     = await User.countDocuments({ role: 'student' });
    const teacherCount     = await User.countDocuments({ role: 'teacher' });
    const hodCount         = await User.countDocuments({ role: 'hod' });
    const adminCount       = await User.countDocuments({ role: 'admin' });
    const totalCourses     = await Course.countDocuments({});
    const totalAssignments = await Assignment.countDocuments({});
    const totalResources   = await Resource.countDocuments({});
    const totalQuizzes     = await Quiz.countDocuments({});
    const totalSubmissions = await Submission.countDocuments({});
    const totalEnrollments = await Enrollment.countDocuments({});
    const gradedSubmissions  = await Submission.countDocuments({ status: 'graded' });
    const pendingSubmissions = await Submission.countDocuments({ status: 'submitted' });

    // ── Recent 8 users (for activity feed) ────────────────────────────
    const recentUsers = await User.find({})
      .select('name email role createdAt department semester')
      .sort({ createdAt: -1 })
      .limit(8);

    // ── Monthly user registrations — last 6 months ────────────────────
    const now = new Date();
    const monthlyReg = [];
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
      monthlyReg.push(count);
      monthLabels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    }

    // ── Top 5 courses by enrollment count ─────────────────────────────
    const topCourses = await Enrollment.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { name: '$course.name', code: '$course.code', count: 1 } }
    ]);

    // ── Submission trend — last 6 months ──────────────────────────────
    const submissionTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await Submission.countDocuments({ createdAt: { $gte: start, $lte: end } });
      submissionTrend.push(count);
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        roles: { student: studentCount, teacher: teacherCount, hod: hodCount, admin: adminCount },
        totalCourses,
        totalAssignments,
        totalResources,
        totalQuizzes,
        totalSubmissions,
        totalEnrollments,
        gradedSubmissions,
        pendingSubmissions,
        monthLabels,
        monthlyReg,
        submissionTrend,
        topCourses,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExamInchargeStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments({});
    const totalExamPapers = await GeneratedPaper.countDocuments({});
    
    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalExamPapers,
        gradeBoundaries: {
          aGrade: 85,
          bGrade: 70,
          cGrade: 50,
          dGrade: 40
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAccountantStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const challans = await FeeChallan.find({});
    
    const paidAmount = challans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const netPayable = challans.reduce((sum, c) => sum + (c.netPayable || 0), 0);
    const pendingAmount = Math.max(0, netPayable - paidAmount);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalRevenue: paidAmount,
        pendingRevenue: pendingAmount,
        totalChallans: challans.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentStats,
  getTeacherStats,
  getHODStats,
  getAdminStats,
  getExamInchargeStats,
  getAccountantStats
};
