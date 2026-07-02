const LiveLecture = require('../models/LiveLecture');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');

// @desc    Create/Schedule live lecture
// @route   POST /api/live-lectures
// @access  Private (Teacher/Admin/HOD)
const createLecture = async (req, res) => {
  try {
    const { courseId, topic, startTime, duration } = req.body;

    if (!courseId || !topic || !startTime) {
      return res.status(400).json({ success: false, message: 'Please provide courseId, topic, and startTime' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to schedule lectures for this course' });
    }

    // Generate unique Jitsi Meet classroom room link
    const slug = topic.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const generatedLink = `https://meet.jit.si/ailms-class-${slug || 'session'}-${Math.random().toString(36).substring(2, 7)}`;

    const lecture = await LiveLecture.create({
      course: courseId,
      teacher: req.user._id,
      topic,
      startTime,
      duration: duration || 60,
      meetingLink: generatedLink,
      status: 'scheduled'
    });

    res.status(201).json({ success: true, data: lecture, message: 'Live lecture scheduled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all lectures for a course
// @route   GET /api/live-lectures/course/:courseId
// @access  Private
const getLectures = async (req, res) => {
  try {
    const lectures = await LiveLecture.find({ course: req.params.courseId })
      .sort({ startTime: -1 })
      .populate('teacher', 'name email');
    res.status(200).json({ success: true, data: lectures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lecture status/details
// @route   PUT /api/live-lectures/:id
// @access  Private (Teacher/Admin/HOD)
const updateLectureStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let lecture = await LiveLecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Live lecture not found' });
    }

    // Verify teacher authorization
    const course = await Course.findById(lecture.course);
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this lecture' });
    }

    lecture.status = status || lecture.status;
    await lecture.save();

    res.status(200).json({ success: true, data: lecture, message: 'Lecture status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join live lecture + automatic attendance marking
// @route   POST /api/live-lectures/:id/join
// @access  Private (Student)
const joinLecture = async (req, res) => {
  try {
    const lecture = await LiveLecture.findById(req.params.id);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    // Enforce email domain restriction
    const email = req.user.email;
    if (!email || !email.toLowerCase().endsWith('@ailms.edu')) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You must join using your official university Google account (@ailms.edu).'
      });
    }

    // Register student join in live lecture details (if not already logged)
    const alreadyJoined = lecture.joinedStudents.some(s => s.student.toString() === req.user.id);
    if (!alreadyJoined) {
      lecture.joinedStudents.push({ student: req.user._id });
      await lecture.save();
    }

    // AUTOMATIC ATTENDANCE MARKING
    const sessionDate = new Date();
    sessionDate.setHours(0, 0, 0, 0); // start of today

    let attendance = await Attendance.findOne({ course: lecture.course, date: sessionDate });

    if (attendance) {
      // Find this student in attendance records
      const recordIndex = attendance.records.findIndex(r => r.student.toString() === req.user.id);
      if (recordIndex !== -1) {
        // Update status to present if they were absent/late
        attendance.records[recordIndex].status = 'present';
      } else {
        // Add student to sheet
        attendance.records.push({ student: req.user._id, status: 'present' });
      }
      await attendance.save();
    } else {
      // Create new attendance sheet for today, marked absent for everyone, except this student who is present
      const enrollments = await Enrollment.find({ course: lecture.course });
      const records = enrollments.map(e => ({
        student: e.student,
        status: e.student.toString() === req.user.id ? 'present' : 'absent'
      }));

      // If the student wasn't found in current enrollments for some reason, append them manually
      const hasMe = records.some(r => r.student.toString() === req.user.id);
      if (!hasMe) {
        records.push({ student: req.user._id, status: 'present' });
      }

      await Attendance.create({
        course: lecture.course,
        date: sessionDate,
        records
      });
    }

    res.status(200).json({
      success: true,
      meetingLink: lecture.meetingLink,
      message: 'Attendance recorded. Redirecting to live room...'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLecture,
  getLectures,
  updateLectureStatus,
  joinLecture
};
