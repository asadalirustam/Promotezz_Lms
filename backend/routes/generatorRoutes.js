const express = require('express');
const router = express.Router();
const {
  uploadPDF,
  generateQuestions,
  saveQuiz,
  savePaper,
  getPapersByCourse,
  deletePaper,
  exportPaperPDF,
  getAllPapers,
  downloadPaperById
} = require('../controllers/generatorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all generator routes
router.use(protect);

// ============================================================
//  TEACHER-ONLY: Only teachers can upload, generate & save
// ============================================================

// PDF Upload Endpoint — TEACHER ONLY
router.post('/upload', authorize('teacher'), upload.single('file'), uploadPDF);

// Question generation endpoint — TEACHER ONLY
router.post('/generate', authorize('teacher'), generateQuestions);

// Save endpoints — TEACHER ONLY
router.post('/save-quiz',  authorize('teacher'), saveQuiz);
router.post('/save-paper', authorize('teacher'), savePaper);

// Delete paper — TEACHER ONLY
router.delete('/papers/:id', authorize('teacher'), deletePaper);

// ============================================================
//  READ: Teachers can view their saved papers
// ============================================================
router.get('/papers/course/:courseId', authorize('teacher'), getPapersByCourse);

// Export PDF — TEACHER ONLY (only teachers can export their own papers)
router.post('/export-pdf', authorize('teacher'), exportPaperPDF);

// Examination Incharge Endpoints
router.get('/papers', authorize('examination_incharge', 'hod', 'admin'), getAllPapers);
router.get('/papers/:id/download', authorize('examination_incharge', 'hod', 'admin', 'teacher'), downloadPaperById);

module.exports = router;
