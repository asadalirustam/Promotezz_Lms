const { GoogleGenerativeAI } = require('@google/generative-ai');
const ExamPrep = require('../models/ExamPrep');
const Course = require('../models/Course');
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

// 1. Generate Exam Preparation Material
const generatePrepMaterial = async (req, res) => {
  try {
    const { courseId, topic } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const studentId = req.user._id;
    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    let material = null;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a university exam supervisor.
Generate exam prep material for the course "${course.name} (${course.code})" on the topic: "${topic || 'All syllabus topics'}".

Return a JSON object with this exact structure:
{
  "practiceMCQs": [
    { "question": "Q text", "options": ["option A", "option B", "option C", "option D"], "answer": "option A" }
  ],
  "trueFalse": [
    { "statement": "TF text", "answer": true }
  ],
  "shortQuestions": [
    { "question": "Q text", "keywords": ["keyword 1", "keyword 2"] }
  ],
  "longQuestions": [
    { "question": "Q text", "outline": ["outline point 1", "outline point 2"] }
  ],
  "flashcards": [
    { "question": "flash Q", "answer": "flash A" }
  ]
}
Only output raw valid JSON.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      try {
        const cleaned = cleanJson(responseText);
        material = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini exam response:', responseText, parseErr);
      }
    }

    if (!material) {
      // Mock Fallback
      material = {
        practiceMCQs: [
          { question: 'What is the activation function typically used in hidden layers of feedforward neural networks?', options: ['Sigmoid', 'ReLU', 'Linear', 'Binary Step'], answer: 'ReLU' },
          { question: 'Which optimization algorithm adapts learning rates per-parameter based on historical gradients?', options: ['Stochastic Gradient Descent (SGD)', 'Adam', 'Momentum', 'Nesterov Accelerated Gradient'], answer: 'Adam' }
        ],
        trueFalse: [
          { statement: 'Convolutional neural networks are fully translation invariant by default.', answer: false },
          { statement: 'Dropout regularisation works by randomly turning off neural nodes during evaluation inference.', answer: false }
        ],
        shortQuestions: [
          { question: 'Explain the purpose of learning rate schedules.', keywords: ['step decay', 'decay rate', 'optimizer step', 'convergence'] },
          { question: 'What are the main causes of vanishing gradients in deep networks?', keywords: ['chain rule multiplication', 'sigmoid saturation', 'derivative < 1'] }
        ],
        longQuestions: [
          { question: 'Explain the Transformer architecture attention mechanism. Focus on Self-Attention formulas and Multi-Head details.', outline: ['Queries, Keys and Values projection vectors', 'Scale Dot-Product Attention equation', 'Softmax scoring and division by sqrt of dimensions', 'Multi-Head linear mapping concatenation'] }
        ],
        flashcards: [
          { question: 'Define Batch Normalisation.', answer: 'Technique to normalize hidden layer inputs per-batch to stabilize internal covariate shift and accelerate model training.' },
          { question: 'What is Loss Function?', answer: 'Mathematical representation measuring the difference between predicted values and actual target variables.' }
        ]
      };
    }

    // Save/Update in DB
    let prep = await ExamPrep.findOne({ student: studentId, course: courseId });
    if (prep) {
      prep.practiceMCQs = material.practiceMCQs;
      prep.trueFalse = material.trueFalse;
      prep.shortQuestions = material.shortQuestions;
      prep.longQuestions = material.longQuestions;
      prep.flashcards = material.flashcards;
      prep.progress = 0; // Reset progress
      await prep.save();
    } else {
      prep = await ExamPrep.create({
        student: studentId,
        course: courseId,
        practiceMCQs: material.practiceMCQs,
        trueFalse: material.trueFalse,
        shortQuestions: material.shortQuestions,
        longQuestions: material.longQuestions,
        flashcards: material.flashcards,
        progress: 0
      });
    }

    // Award Student Gamification XP (+20 XP for initiating prep)
    const student = await User.findById(studentId);
    if (student) {
      student.xp += 20;
      await student.save();
    }

    res.status(200).json({ success: true, data: prep });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Fetch Exam Prep Material
const getPrepMaterial = async (req, res) => {
  try {
    const prep = await ExamPrep.findOne({ student: req.user._id, course: req.params.courseId });
    if (!prep) {
      return res.status(404).json({ success: false, message: 'No prep material generated yet. Click generate to start!' });
    }
    res.status(200).json({ success: true, data: prep });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Prep progress
const updatePrepProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress === undefined) {
      return res.status(400).json({ success: false, message: 'Progress rate is required' });
    }

    const prep = await ExamPrep.findOne({ student: req.user._id, course: req.params.courseId });
    if (!prep) {
      return res.status(404).json({ success: false, message: 'Prep material not found' });
    }

    prep.progress = progress;
    await prep.save();

    // Award +40 XP if student fully completes preparation (100% progress)
    if (progress === 100) {
      const student = await User.findById(req.user._id);
      if (student) {
        student.xp += 40;
        
        // Award Exam Master badge if not already unlocked
        const hasBadge = student.badges.some(b => b.name === 'Exam Ready Master');
        if (!hasBadge) {
          student.badges.push({ name: 'Exam Ready Master', icon: 'Award' });
        }
        
        await student.save();
      }
    }

    res.status(200).json({ success: true, message: 'Preparation progress updated', data: prep });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generatePrepMaterial,
  getPrepMaterial,
  updatePrepProgress
};
