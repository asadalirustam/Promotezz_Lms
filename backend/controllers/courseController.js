const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin/Teacher/HOD)
const createCourse = async (req, res) => {
  try {
    const { name, code, description, creditHours, semester, teacher, category } = req.body;

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
      category
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

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyEnrolledCourses,
  getCourseStudents
};
