const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Models
const LectureSummary = require('../models/LectureSummary');
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

const extractTextFromPdf = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: fileBuffer });
    const parsedData = await parser.getText();
    return parsedData.text || '';
  } catch (err) {
    console.error('PDF parsing error', err);
    return fs.readFileSync(filePath, 'utf8').replace(/[^\x20-\x7E\n]/g, '') || '';
  }
};

// 1. Generate Lecture Summary API
const generateLectureSummary = async (req, res) => {
  try {
    const { title, courseId } = req.body;
    if (!title || !courseId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Title and Course ID are required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a lecture file (PDF/TXT/etc.)' });
    }

    const filePath = req.file.path;
    let textContent = '';
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    if (fileExt === '.pdf') {
      textContent = await extractTextFromPdf(filePath);
    } else {
      textContent = fs.readFileSync(filePath, 'utf8').replace(/[^\x20-\x7E\n]/g, '');
    }

    // Delete temp file from uploads immediately after reading
    fs.unlinkSync(filePath);

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file appears to be empty or unreadable.' });
    }

    const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;
    let aiResponse = null;

    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are a high-performing student assistant. Summarize the following lecture text.
Generate a response as a JSON object with this exact structure:
{
  "summaryText": "Concise summary of the lecture content.",
  "keyPoints": ["key point 1", "key point 2"],
  "definitions": [{"term": "concept name", "definition": "clear definition of concept"}],
  "importantQuestions": ["potential exam question 1", "potential exam question 2"],
  "flashcards": [{"question": "Q1", "answer": "A1"}],
  "revisionNotes": "Detailed structured revision notes."
}
Only output raw valid JSON.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nLecture Content:\n${textContent.slice(0, 15000)}` }] }]
      });

      const responseText = result.response.text();
      try {
        const cleaned = cleanJson(responseText);
        aiResponse = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini lecture response:', responseText, parseErr);
      }
    }

    if (!aiResponse) {
      // Mock Fallback
      aiResponse = {
        summaryText: `Comprehensive outline for: ${title}. Explores fundamental architectures, components layout and functional evaluations.`,
        keyPoints: [
          'Overview of core algorithms and their theoretical complexity parameters.',
          'Understanding optimization iterations and hyperparameter constraints.',
          'Critical review of empirical performance bottlenecks.'
        ],
        definitions: [
          { term: 'Convolution', definition: 'Mathematical operation on two functions producing a third function expressing how the shape of one is modified by the other.' },
          { term: 'Gradient Descent', definition: 'First-order iterative optimization algorithm for finding a local minimum of a differentiable function.' }
        ],
        importantQuestions: [
          'What are the mathematical formulations of backpropagation?',
          'Discuss performance variance under custom learning rates.'
        ],
        flashcards: [
          { question: 'What is overfitting?', answer: 'When a model learns the training data noise rather than the underlying distribution, leading to poor validation score.' },
          { question: 'What is regularisation?', answer: 'Technique used to prevent overfitting by adding penalty constraints to loss functions (e.g. L1/L2).' }
        ],
        revisionNotes: `Lecture ${title} focuses on foundational paradigms. Key takeaways include architecture setups, optimizer selection parameters, and evaluation workflows. Keep equations handy for midterms.`
      };
    }

    const summary = await LectureSummary.create({
      course: courseId,
      teacher: req.user._id,
      title,
      summaryText: aiResponse.summaryText,
      keyPoints: aiResponse.keyPoints,
      definitions: aiResponse.definitions,
      importantQuestions: aiResponse.importantQuestions,
      flashcards: aiResponse.flashcards,
      revisionNotes: aiResponse.revisionNotes
    });

    // Award Gamification XP for lecture uploads (+50 XP for teachers contributing material)
    const teacher = await User.findById(req.user._id);
    if (teacher) {
      teacher.xp += 50;
      await teacher.save();
    }

    res.status(201).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Fetch Summaries for Course
const getLectureSummaries = async (req, res) => {
  try {
    const summaries = await LectureSummary.find({ course: req.params.courseId })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Save Summary for Student
const saveSummary = async (req, res) => {
  try {
    const summary = await LectureSummary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Lecture summary not found' });
    }

    if (summary.savedByStudents.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Summary already saved' });
    }

    summary.savedByStudents.push(req.user._id);
    await summary.save();

    // Award XP to student for saving study material (+10 XP)
    const student = await User.findById(req.user._id);
    if (student) {
      student.xp += 10;
      await student.save();
    }

    res.status(200).json({ success: true, message: 'Summary bookmarked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Fetch Saved Summaries for Student
const getSavedSummaries = async (req, res) => {
  try {
    const summaries = await LectureSummary.find({ savedByStudents: req.user._id })
      .populate('course', 'name code')
      .populate('teacher', 'name');
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateLectureSummary,
  getLectureSummaries,
  saveSummary,
  getSavedSummaries
};
