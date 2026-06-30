const { GoogleGenerativeAI } = require('@google/generative-ai');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');

const cleanJson = (text) => {
  let cleaned = text.trim();
  const firstBracket = cleaned.indexOf('{');
  const lastBracket = cleaned.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  return cleaned.trim();
};

// 1. Generate Study Plan
const generatePlan = async (req, res) => {
  try {
    const { subjects, examDate, weakTopics, dailyHours } = req.body;

    if (!subjects || !examDate || !dailyHours) {
      return res.status(400).json({ success: false, message: 'Please provide subjects, exam date, and daily hours' });
    }

    const studentId = req.user._id;
    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    let plan = null;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are an expert AI Study Planner.
Generate a structured study plan based on:
- Subjects: ${subjects.join(', ')}
- Exam Date: ${new Date(examDate).toLocaleDateString()}
- Weak Areas: ${(weakTopics || []).join(', ')}
- Daily Committed Study Hours: ${dailyHours} hours

Return a JSON object with this exact structure:
{
  "dailyPlan": {
    "Morning Session": "Subject and focus topic details",
    "Afternoon Session": "Subject and focus topic details",
    "Evening Session": "Subject and focus topic details"
  },
  "weeklyPlan": {
    "Week 1": "Key milestones and chapters covered",
    "Week 2": "Key milestones and chapters covered",
    "Week 3": "Key milestones and chapters covered"
  },
  "revisionPlan": [
    "revision strategy 1 (e.g. self quiz)",
    "revision strategy 2"
  ],
  "breakSchedule": {
    "frequency": "e.g. Every 50 mins of study",
    "duration": "e.g. 10 mins break",
    "activity": "e.g. Light stretch and hydration"
  }
}
Only output raw valid JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
      });

      const responseText = result.response.text();
      try {
        const cleaned = cleanJson(responseText);
        plan = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini planner response:', responseText, parseErr);
      }
    }

    if (!plan) {
      // Mock Fallback
      plan = {
        dailyPlan: {
          'Morning Session': `Focus 2 hours on core conceptual modules in ${subjects[0] || 'AI models'}.`,
          'Afternoon Session': `Devote ${Math.max(1, dailyHours - 3)} hours solving practical exercises in ${subjects[1] || 'Math'} and weak areas: ${(weakTopics || ['strides']).join(', ')}.`,
          'Evening Session': '1.5 hours reviewing summaries and compiling revision notes.'
        },
        weeklyPlan: {
          'Week 1': `Complete fundamental chapters of ${subjects.join(' and ')}. Focus on weak areas.`,
          'Week 2': 'Solve past papers, run mock tests, and summarize formulas.',
          'Week 3': 'Perform full revision splits and execute final testing checklist.'
        },
        revisionPlan: [
          'Pomodoro technique: review summaries at the end of each session.',
          'Active Recall: write definitions without referencing slides.',
          'Solve mock MCQs 4 days before exams.'
        ],
        breakSchedule: {
          frequency: 'Every 45 minutes of active focus',
          duration: '15 minutes recovery interval',
          activity: 'Step away from screen, drink water, simple breathing exercises.'
        }
      };
    }

    // Save/Update in DB
    let studentPlan = await StudyPlan.findOne({ student: studentId });
    if (studentPlan) {
      studentPlan.subjects = subjects;
      studentPlan.examDate = examDate;
      studentPlan.weakTopics = weakTopics;
      studentPlan.dailyHours = dailyHours;
      studentPlan.planData = plan;
      await studentPlan.save();
    } else {
      studentPlan = await StudyPlan.create({
        student: studentId,
        subjects,
        examDate,
        weakTopics,
        dailyHours,
        planData: plan
      });
    }

    // Award XP to student (+30 XP)
    const student = await User.findById(studentId);
    if (student) {
      student.xp += 30;
      await student.save();
    }

    res.status(200).json({ success: true, data: studentPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Fetch Active Study Plan
const getPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ student: req.user._id });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'No active study plan found' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Customize Study Plan (Update local schedule nodes)
const customizePlan = async (req, res) => {
  try {
    const { planData } = req.body;
    if (!planData) {
      return res.status(400).json({ success: false, message: 'Plan data is required' });
    }

    const plan = await StudyPlan.findOne({ student: req.user._id });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Study plan not found' });
    }

    plan.planData = planData;
    await plan.save();

    res.status(200).json({ success: true, message: 'Plan customized successfully', data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generatePlan,
  getPlan,
  customizePlan
};
