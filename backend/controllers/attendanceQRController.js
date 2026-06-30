const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');

// Scan QR Student ID and mark attendance (Teacher role only)
const scanQRAttendance = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, message: 'Student ID and Course ID are required' });
    }

    // Verify course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Selected course not found' });
    }

    // Verify student exists and is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Invalid Student ID scanned' });
    }

    // Normalize date to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create daily attendance sheet
    let attendanceSheet = await Attendance.findOne({ course: courseId, date: today });
    if (!attendanceSheet) {
      attendanceSheet = await Attendance.create({
        course: courseId,
        date: today,
        records: []
      });
    }

    // Check if student record already exists
    const recordIndex = attendanceSheet.records.findIndex(r => r.student.toString() === studentId);
    if (recordIndex !== -1) {
      // If already present, let the user know
      if (attendanceSheet.records[recordIndex].status === 'present') {
        return res.status(200).json({
          success: true,
          message: `${student.name} is already marked Present.`,
          data: attendanceSheet
        });
      }
      attendanceSheet.records[recordIndex].status = 'present';
    } else {
      attendanceSheet.records.push({
        student: studentId,
        status: 'present'
      });
    }

    await attendanceSheet.save();

    // Award Student Gamification XP (+20 XP for scanning/present)
    student.xp += 20;
    
    // Check if Perfect Attendance badge can be unlocked (optional mock metric)
    const hasBadge = student.badges.some(b => b.name === 'Perfect Attendance');
    if (!hasBadge) {
      student.badges.push({ name: 'Perfect Attendance', icon: 'CheckCircle' });
    }
    
    await student.save();

    res.status(200).json({
      success: true,
      message: `Successfully marked ${student.name} Present.`,
      data: attendanceSheet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  scanQRAttendance
};
