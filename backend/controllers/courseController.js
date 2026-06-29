const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin/Teacher/HOD)
const createCourse = async (req, res) => {
  try {
    const { name, code, description, creditHours, semester, teacher, category, schedule } = req.body;

    if (!name || !code || !creditHours || !semester || !teacher || !category) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Verify teacher exists and is actually a teacher
    const teacherUser = await User.findById(teacher);
    if (!teacherUser || teacherUser.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID specified' });
    }

    // Check code unique
    const courseExists = await Course.findOne({ code });
    if (courseExists) {
      return res.status(400).json({ success: false, message: 'Course with this code already exists' });
    }

    const course = await Course.create({
      name,
      code,
      description,
      creditHours,
      semester,
      teacher,
      category,
      schedule
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all courses (with filters based on role)
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    let query = {};

    // Filter by role
    if (req.user.role === 'teacher') {
      query.teacher = req.user.id;
    } else if (req.user.role === 'student') {
      // Students see courses relevant to their semester
      query.semester = req.user.semester;
    }

    const courses = await Course.find(query).populate('teacher', 'name email');
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name email');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course details
// @route   PUT /api/courses/:id
// @access  Private (Admin/Teacher/HOD)
const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Double check that if the user is a teacher, they can only edit their own course
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this course' });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin/Teacher/HOD)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();
    
    // Clean up enrollments for this course
    await Enrollment.deleteMany({ course: req.params.id });

    res.status(200).json({ success: true, message: 'Course and related records removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    });

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: req.params.id,
      status: 'active'
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get enrolled courses for current student
// @route   GET /api/courses/enrolled/me
// @access  Private (Student)
const getMyEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'name email' }
      });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments.map(e => e.course)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students enrolled in a specific course
// @route   GET /api/courses/:id/students
// @access  Private (Teacher/HOD/Admin)
const getCourseStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email profileImage semester department');

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments.map(e => e.student)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get gradebook list for a course
// @route   GET /api/courses/:id/gradebook
// @access  Private (Teacher/HOD/Admin)
const getCourseGradebook = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Auth verification
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this gradebook' });
    }

    const gradebook = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email semester department')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: gradebook.length, data: gradebook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update sessional marks & grade for a student
// @route   PUT /api/courses/:id/gradebook/:enrollmentId
// @access  Private (Teacher/HOD/Admin)
const updateStudentGrades = async (req, res) => {
  try {
    const { 
      midtermMarks, 
      finalMarks, 
      sessionalMarks, 
      assignmentMarks, 
      quizMarks, 
      grade, 
      status 
    } = req.body;

    const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }

    // Verify teacher authorization
    if (req.user.role === 'teacher' && enrollment.course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify grades for this course' });
    }

    // Save numeric updates
    enrollment.midtermMarks = Number(midtermMarks) || 0;
    enrollment.finalMarks = Number(finalMarks) || 0;
    enrollment.sessionalMarks = Number(sessionalMarks) || 0;
    enrollment.assignmentMarks = Number(assignmentMarks) || 0;
    enrollment.quizMarks = Number(quizMarks) || 0;
    
    // Auto-calculate totalMarks
    enrollment.totalMarks = 
      enrollment.midtermMarks + 
      enrollment.finalMarks + 
      enrollment.sessionalMarks + 
      enrollment.assignmentMarks + 
      enrollment.quizMarks;

    // Determine or assign grades based on score scale
    if (grade) {
      enrollment.grade = grade;
    } else {
      // Auto-assign letter grades out of 100
      const total = enrollment.totalMarks;
      if (total >= 85) enrollment.grade = 'A';
      else if (total >= 80) enrollment.grade = 'A-';
      else if (total >= 75) enrollment.grade = 'B+';
      else if (total >= 70) enrollment.grade = 'B';
      else if (total >= 65) enrollment.grade = 'B-';
      else if (total >= 60) enrollment.grade = 'C+';
      else if (total >= 55) enrollment.grade = 'C';
      else if (total >= 50) enrollment.grade = 'D';
      else enrollment.grade = 'F';
    }

    // Set GPA grade points corresponding to letter grades
    const gpaScale = {
      'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0,
      'D': 1.0, 'F': 0.0, 'N/A': 0.0
    };
    enrollment.gradePoints = gpaScale[enrollment.grade] || 0.0;

    if (status) {
      enrollment.status = status;
    }

    await enrollment.save();

    res.status(200).json({ 
      success: true, 
      message: 'Student marks and grades successfully updated!', 
      data: enrollment 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's own enrollment record for a specific course
// @route   GET /api/courses/:id/enrollment/me
// @access  Private (Student)
const getMyCourseEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    }).populate('course', 'name code creditHours');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found for this course' });
    }

    res.status(200).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyEnrolledCourses,
  getCourseStudents,
  getCourseGradebook,
  updateStudentGrades,
  getMyCourseEnrollment
};
