const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const QuizResult = require('../models/QuizResult');
const Submission = require('../models/Submission');

const cleanJson = (text) => {
  let cleaned = text.trim();
  const firstBracket = cleaned.indexOf('{');
  const lastBracket = cleaned.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned.trim();
};

// 1. Get Career Advice
const getCareerAdvice = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Load enrollments & grades to calculate CGPA
    const enrollments = await Enrollment.find({ student: student._id }).populate('course');
    const submissions = await Submission.find({ student: student._id, status: 'graded' });
    const quizResults = await QuizResult.find({ student: student._id });

    // Calculate simulated GPA
    let totalScore = 0;
    let count = 0;

    submissions.forEach(s => {
      if (s.grade) {
        totalScore += s.grade;
        count++;
      }
    });

    quizResults.forEach(q => {
      if (q.score !== undefined && q.totalQuestions) {
        const percentage = (q.score / q.totalQuestions) * 100;
        totalScore += percentage;
        count++;
      }
    });

    const averagePercentage = count > 0 ? totalScore / count : 82;
    // Map average percentage (0-100) to GPA (0-4.0)
    const calculatedGPA = ((averagePercentage / 100) * 4.0).toFixed(2);

    const completedCourses = enrollments.map(e => `${e.course.name} (${e.course.code})`);
    const studentSkills = student.skills.length > 0 ? student.skills : ['Python', 'SQL', 'Data structures'];
    const studentInterests = student.interests.length > 0 ? student.interests : ['Machine Learning', 'Computer Vision'];

    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    let recommendation = null;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are an expert AI Career Advisor for university students.
Analyze the following student profile and generate a comprehensive career recommendation:
- Department: ${student.department}
- Semester: ${student.semester}
- GPA: ${calculatedGPA}
- Current Skills: ${studentSkills.join(', ')}
- Interests: ${studentInterests.join(', ')}
- Completed Courses: ${completedCourses.join(', ')}

Return a JSON object with this exact structure:
{
  "recommendedPaths": ["Path 1 (e.g. MLOps Engineer)", "Path 2"],
  "missingSkills": ["skill 1", "skill 2"],
  "certifications": ["cert 1", "cert 2"],
  "onlineCourses": ["course 1", "course 2"],
  "internshipSuggestions": ["internship role 1", "internship role 2"],
  "jobRoles": ["job role 1", "job role 2"],
  "learningRoadmap": [
    { "phase": "Phase 1: Short Term (1-3 months)", "actions": ["action 1", "action 2"] },
    { "phase": "Phase 2: Mid Term (3-6 months)", "actions": ["action 1", "action 2"] }
  ]
}
Only output raw valid JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
      });

      const responseText = result.response.text();
      try {
        const cleaned = cleanJson(responseText);
        recommendation = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini career response:', responseText, parseErr);
      }
    }

    if (!recommendation) {
      // Mock Fallback
      recommendation = {
        recommendedPaths: [
          'Machine Learning Engineer',
          'Data Scientist / Analytics Officer',
          'AI Software Architect'
        ],
        missingSkills: [
          'Docker & Kubernetes for MLOps',
          'PyTorch deep learning model pipeline optimization',
          'Advanced Cloud Deployment (AWS/GCP)'
        ],
        certifications: [
          'Google Cloud Professional Machine Learning Engineer',
          'TensorFlow Developer Certificate'
        ],
        onlineCourses: [
          'DeepLearning.AI TensorFlow Developer Professional Certificate',
          'Machine Learning Engineering for Production (MLOps) Specialization on Coursera'
        ],
        internshipSuggestions: [
          'Junior AI Intern at local Tech Incubators',
          'Data Scientist Intern at E-commerce Analytics division'
        ],
        jobRoles: [
          'MLOps Engineer',
          'AI Solutions Consultant',
          'Data Infrastructure Analyst'
        ],
        learningRoadmap: [
          { phase: 'Phase 1: Foundation (Month 1-2)', actions: ['Master Docker packaging for local model inference.', 'Enhance SQL database schema optimization skills.'] },
          { phase: 'Phase 2: Deep Learning (Month 3-4)', actions: ['Build and fine-tune model architectures in PyTorch.', 'Complete AWS SageMaker setup tutorials.'] },
          { phase: 'Phase 3: Deployments & Portfolio (Month 5-6)', actions: ['Publish 2 ML pipeline pipelines on GitHub.', 'Apply for entry-level MLOps developer roles.'] }
        ]
      };
    }

    res.status(200).json({
      success: true,
      gpa: calculatedGPA,
      skills: studentSkills,
      interests: studentInterests,
      recommendation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Update Career Profile
const updateCareerProfile = async (req, res) => {
  try {
    const { skills, interests } = req.body;
    
    // Simple verification
    if (!Array.isArray(skills) || !Array.isArray(interests)) {
      return res.status(400).json({ success: false, message: 'Skills and interests must be arrays of strings' });
    }

    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    student.skills = skills;
    student.interests = interests;
    await student.save();

    res.status(200).json({ success: true, message: 'Career profile updated successfully', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCareerAdvice,
  updateCareerProfile
};
