const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const getDegreeStatus = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch enrollments
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');
    const allCourses = await Course.find({});

    // Calculate completed credits (courses that are graded or marked completed)
    let completedCredits = 0;
    const completedSubjects = [];
    const completedIds = [];

    enrollments.forEach(e => {
      // For demo, if student has gradePoints/completed status, count credits
      if (e.status === 'completed' || e.gradePoints !== undefined) {
        completedCredits += e.course.creditHours || 3;
        completedSubjects.push(`${e.course.name} (${e.course.code})`);
        completedIds.push(e.course._id.toString());
      }
    });

    const totalCreditsRequired = 132;
    const remainingCredits = Math.max(0, totalCreditsRequired - completedCredits);

    // List remaining subjects
    const remainingSubjects = [];
    allCourses.forEach(c => {
      if (!completedIds.includes(c._id.toString())) {
        remainingSubjects.push(`${c.name} (${c.code})`);
      }
    });

    // Graduation percentage
    const graduationPercentage = Math.min(100, Math.round((completedCredits / totalCreditsRequired) * 100));

    // Expected graduation date based on student's current semester (assuming 8 semesters total)
    const semestersLeft = Math.max(0, 8 - (req.user.semester || 1));
    const now = new Date();
    // Add roughly 6 months per semester left
    const gradDate = new Date(now.getFullYear(), now.getMonth() + (semestersLeft * 6), 1);
    const expectedGraduationDate = gradDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Mock CGPA progress data along semesters
    const currentSem = req.user.semester || 1;
    const cgpaProgress = [];
    let rollingGPA = 3.2;

    for (let s = 1; s <= currentSem; s++) {
      // Small simulated fluctuations around student's base CGPA
      rollingGPA += (Math.random() * 0.2 - 0.08);
      cgpaProgress.push({
        semester: `Semester ${s}`,
        gpa: Math.min(4.0, Math.max(2.0, parseFloat(rollingGPA.toFixed(2))))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        completedCredits,
        totalCreditsRequired,
        remainingCredits,
        completedSubjects,
        remainingSubjects: remainingSubjects.slice(0, 8), // Cap size
        graduationPercentage,
        expectedGraduationDate,
        cgpaProgress
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDegreeStatus
};
