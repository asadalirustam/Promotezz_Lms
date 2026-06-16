const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher/Admin/HOD)
const createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, dueDate, maxPoints } = req.body;

    if (!title || !courseId || !dueDate || !maxPoints) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Auth check: if teacher, check if they teach the course
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to create assignments for this course' });
    }

    let fileUrl = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: courseId,
      dueDate,
      maxPoints,
      fileUrl
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getCourseAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId });
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single assignment details
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'name code');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Verify enrollment
    const isEnrolled = await Enrollment.findOne({ student: req.user.id, course: assignment.course });
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'You must be enrolled in this course to submit' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(400).json({ success: false, message: 'Assignment already submitted' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const submission = await Submission.create({
      assignment: req.params.id,
      student: req.user.id,
      fileUrl
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Grade submission
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @access  Private (Teacher/Admin/HOD)
const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    if (grade === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide a grade' });
    }

    const submission = await Submission.findById(req.params.submissionId).populate('assignment');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Verify ownership of the course if role is teacher
    const course = await Course.findById(submission.assignment.course);
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to grade this course submission' });
    }

    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.status = 'graded';
    await submission.save();

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Teacher/Admin/HOD)
const getSubmissionsForAssignment = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'name email profileImage semester');
    
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's own submission for a specific assignment
// @route   GET /api/assignments/:id/submission/me
// @access  Private (Student)
const getMySubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id
    });

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAssignment,
  getCourseAssignments,
  getAssignmentById,
  submitAssignment,
  gradeSubmission,
  getSubmissionsForAssignment,
  getMySubmission
};
