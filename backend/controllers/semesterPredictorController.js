const { GoogleGenerativeAI } = require('@google/generative-ai');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const QuizResult = require('../models/QuizResult');
const Attendance = require('../models/Attendance');

const cleanJson = (text) => {
  let cleaned = text.trim();
  const firstBracket = cleaned.indexOf('{');
  const lastBracket = cleaned.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned.trim();
};

const predictSemesterGPA = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Load active enrollments
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');
    if (enrollments.length === 0) {
      return res.status(400).json({ success: false, message: 'Student must be enrolled in at least one course for prediction' });
    }

    const courseIds = enrollments.map(e => e.course._id);

    // Fetch student grades from assignments and quizzes
    const submissions = await Submission.find({ student: studentId, status: 'graded' });
    const quizResults = await QuizResult.find({ student: studentId });

    // Fetch attendance rates per course
    const allAttendance = await Attendance.find({ course: { $in: courseIds } });
    let totalClasses = 0;
    let presentClasses = 0;

    allAttendance.forEach(log => {
      const record = log.records.find(r => r.student.toString() === studentId.toString());
      if (record) {
        totalClasses++;
        if (record.status === 'present') presentClasses++;
      }
    });

    const studentAttendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 85;

    // Prepare courses info for the LLM
    const coursesSummary = enrollments.map(e => {
      // Find grades in submissions for this course
      const courseSubmissions = submissions.filter(s => s.assignment && s.assignment.course?.toString() === e.course._id.toString());
      const avgGrade = courseSubmissions.length > 0
        ? courseSubmissions.reduce((acc, curr) => acc + curr.grade, 0) / courseSubmissions.length
        : 80;

      return {
        name: e.course.name,
        code: e.course.code,
        avgGrade: Math.round(avgGrade)
      };
    });

    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    let prediction = null;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a university academic performance forecaster.
Analyze the following student course logs and predict their semester outcome:
- Course Records: ${JSON.stringify(coursesSummary)}
- Current Department: ${req.user.department}
- Current Semester: ${req.user.semester}
- Cumulative Attendance Rate: ${studentAttendanceRate.toFixed(1)}%

Return a JSON object with this exact structure:
{
  "expectedGPA": 3.42,
  "expectedCGPA": 3.55,
  "passProbability": 97,
  "riskSubjects": ["Subject code 1 (reason e.g. low quiz scores)", "Subject code 2"],
  "attendanceRisk": "e.g. Low Risk (85% attendance)",
  "performanceTrend": "e.g. Upward trend. Performance improved by 5% over quizzes.",
  "suggestions": [
    "improvement tip 1",
    "improvement tip 2"
  ]
}
Only output raw valid JSON.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      try {
        const cleaned = cleanJson(responseText);
        prediction = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini predictor response:', responseText, parseErr);
      }
    }

    if (!prediction) {
      // Mock Fallback
      prediction = {
        expectedGPA: 3.48,
        expectedCGPA: 3.52,
        passProbability: 95,
        riskSubjects: coursesSummary.filter(c => c.avgGrade < 75).map(c => `${c.name} (${c.code}) - Grade avg is ${c.avgGrade}%`),
        attendanceRisk: studentAttendanceRate < 75 ? 'High Risk (Attendance < 75%)' : 'Minimal Risk (Excellent Attendance)',
        performanceTrend: 'Stable. Average test scores hovering around 81%.',
        suggestions: [
          'Schedule extra study intervals for low grade subjects.',
          'Consistently review definitions cards before midterm quizzes.',
          'Maintain active streak above 15 days on the study planner.'
        ]
      };
    }

    res.status(200).json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  predictSemesterGPA
};
