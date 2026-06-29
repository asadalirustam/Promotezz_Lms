const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Mark attendance for a specific day
// @route   POST /api/attendance
// @access  Private (Teacher/Admin/HOD)
const markAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body; // records: [{ student, status: 'present'|'absent'|'late' }]

    if (!courseId || !date || !records || !records.length) {
      return res.status(400).json({ success: false, message: 'Please provide course, date, and student records' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to log attendance for this course' });
    }

    // Set date to start of day for comparison uniformity
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    // Check if attendance already logged for this date
    let attendance = await Attendance.findOne({ course: courseId, date: sessionDate });

    if (attendance) {
      // Update records
      attendance.records = records;
      await attendance.save();
    } else {
      // Create new
      attendance = await Attendance.create({
        course: courseId,
        date: sessionDate,
        records
      });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance history logs for a course
// @route   GET /api/attendance/course/:courseId
// @access  Private (Teacher/Admin/HOD)
const getCourseAttendanceLogs = async (req, res) => {
  try {
    const logs = await Attendance.find({ course: req.params.courseId })
      .sort({ date: -1 })
      .populate('records.student', 'name email');

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's own attendance statistics across a course
// @route   GET /api/attendance/student/:studentId/course/:courseId
// @access  Private
const getStudentCourseAttendance = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Security check
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const logs = await Attendance.find({ course: courseId }).sort({ date: -1 });
    
    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const detailedLogs = [];

    logs.forEach(log => {
      const record = log.records.find(r => r.student.toString() === studentId);
      if (record) {
        totalClasses++;
        if (record.status === 'present') presentCount++;
        else if (record.status === 'absent') absentCount++;
        else if (record.status === 'late') lateCount++;

        detailedLogs.push({
          date: log.date,
          status: record.status
        });
      }
    });

    // Rule: late counts as 0.5 present
    const percentage = totalClasses > 0 
      ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100) 
      : 100;

    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        percentage,
        logs: detailedLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  markAttendance,
  getCourseAttendanceLogs,
  getStudentCourseAttendance
};
