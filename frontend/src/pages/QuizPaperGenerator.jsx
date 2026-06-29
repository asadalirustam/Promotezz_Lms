import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  Upload,
  FileText,
  Settings,
  Sparkles,
  Edit3,
  Trash2,
  Download,
  Check,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';

const QuizPaperGenerator = () => {
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Wizard Steps
  const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Preview & Save

  // Step 1: Upload States
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pdfData, setPdfData] = useState(null); // { pdfName, characterCount, textContent }
  const [uploadError, setUploadError] = useState('');

  // Step 2: Configuration States
  const [config, setConfig] = useState({
    type: 'mcq',
    count: 5,
    difficulty: 'medium',
    title: '',
    paperType: 'Quiz',
    duration: 15,
    passingMarks: 3,
    totalMarks: 50
  });
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Step 3: Questions List States
  const [questions, setQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null); // Temp copy for modal editing
  const [saveStatus, setSaveStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  // API Keys configurations (persisted in localStorage)
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_key') || '');
  const [showApiConfig, setShowApiConfig] = useState(false);

  const handleSaveApiKeys = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_key', geminiKey.trim());
    localStorage.setItem('openai_key', openaiKey.trim());
    alert('AI Settings successfully updated and saved in local storage!');
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success) {
          setCourses(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedCourse(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    fetchCourses();
  }, []);

  // Set default title when PDF and Course are selected
  useEffect(() => {
    if (pdfData && selectedCourse) {
      const course = courses.find(c => c._id === selectedCourse);
      const coursePrefix = course ? `${course.code} - ` : '';
      const docClean = pdfData.pdfName.replace(/\.[^/.]+$/, "");
      setConfig(prev => ({
        ...prev,
        title: `${coursePrefix}${config.paperType} (${docClean})`
      }));
    }
  }, [pdfData, selectedCourse, config.paperType]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadError('');
    } else {
      setUploadError('Please drop a valid PDF file.');
    }
  };

  // Process PDF Upload
  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to parse.');
      return;
    }
    if (!selectedCourse) {
      setUploadError('Please map this upload to an active course.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/generator/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setPdfData(res.data);
        setStep(2);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to extract text from PDF');
    } finally {
      setUploading(false);
    }
  };

  // Call AI Generator API
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!pdfData) return;

    try {
      setGenerating(true);
      setGenError('');
      const payload = {
        courseId: selectedCourse,
        pdfName: pdfData.pdfName,
        textContent: pdfData.textContent,
        type: config.type,
        count: config.count,
        difficulty: config.difficulty
      };

      const res = await api.post('/generator/generate', payload);
      if (res.data.success) {
        setQuestions(res.data.data);
        setStep(3);
      }
    } catch (err) {
      setGenError(err.response?.data?.message || 'AI Generation Failed. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  // Save as student-attemptable LMS Quiz
  const handleSaveQuiz = async () => {
    try {
      setSaveStatus('saving');
      const payload = {
        title: config.title || 'AI Generated Quiz',
        courseId: selectedCourse,
        duration: config.duration,
        passingMarks: config.passingMarks,
        questions: questions
      };

      const res = await api.post('/generator/save-quiz', payload);
      if (res.data.success) {
        alert('Quiz created successfully in active LMS modules! Students can now attempt it.');
        setSaveStatus('success');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to integrate Quiz');
      setSaveStatus('error');
    }
  };

  // Save as exam paper layout (Print/Final/Midterm layout)
  const handleSavePaper = async () => {
    try {
      setSaveStatus('saving');
      const payload = {
        title: config.title || 'AI Generated Exam Paper',
        courseId: selectedCourse,
        paperType: config.paperType,
        pdfName: pdfData.pdfName,
        difficulty: config.difficulty,
        totalMarks: config.totalMarks,
        questions: questions
      };

      const res = await api.post('/generator/save-paper', payload);
      if (res.data.success) {
        setSaveStatus('success');
        // Auto-reset the button after 3 seconds
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save exam paper. Please try again.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Export PDF Document from backend kit
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const course = courses.find(c => c._id === selectedCourse);
      const payload = {
        title: config.title || 'AI Exam Sheet',
        courseCode: course?.code || 'AI-301',
        courseName: course?.name || 'Subject',
        paperType: config.paperType,
        totalMarks: config.totalMarks,
        questions: questions
      };

      const res = await api.post('/generator/export-pdf', payload, {
        responseType: 'blob'
      });

      // Create a virtual file link to download the PDF stream
      const fileUrl = window.URL.createObjectURL(new Blob([res.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `${config.paperType.toLowerCase()}_exam.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Failed to generate PDF document');
    } finally {
      setExporting(false);
    }
  };

  // Delete Question from Roster
  const handleDeleteQuestion = (idxToDelete) => {
    setQuestions(questions.filter((_, idx) => idx !== idxToDelete));
  };

  // Open Edit Dialog
  const handleOpenEdit = (idx) => {
    setEditingIndex(idx);
    setEditQuestion({ ...questions[idx] });
  };

  // Save Edit Dialog changes
  const handleSaveEdit = () => {
    const updated = [...questions];
    updated[editingIndex] = editQuestion;
    setQuestions(updated);
    setEditingIndex(null);
    setEditQuestion(null);
  };

  // ─── TEACHER-ONLY GUARD ────────────────────────────────────────────────────
  if (user?.role !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-6">
        <div
          className="p-6 rounded-2xl text-center max-w-sm space-y-4"
          style={{
            background: 'rgba(8,20,48,0.85)',
            border: '1px solid rgba(239,68,68,0.25)',
            boxShadow: '0 8px 32px rgba(239,68,68,0.08)'
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(239,68,68,0.12)' }}
          >
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Access Restricted</h2>
          <p className="text-sm text-sky-400">
            The <span className="text-cyan-400 font-semibold">AI Paper Generator</span> is exclusively available to <span className="text-cyan-400 font-semibold">Teachers</span>.
          </p>
          <p className="text-xs text-sky-600">
            Only verified faculty members can generate, edit and save exam papers through this module.
          </p>
        </div>
      </div>
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          AI Quiz & Paper Generator
        </h1>
        <p className="text-sm text-sky-500">
          Upload class materials in PDF format, parse text automatically, and prompt AI to generate quizzes or balanced exam sheets.
        </p>
      </div>

      {/* Progress Wizard Steps */}
      <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl max-w-xl">
        {[
          { stepNum: 1, label: 'Upload PDF', icon: Upload },
          { stepNum: 2, label: 'Configure AI', icon: Settings },
          { stepNum: 3, label: 'Preview & Export', icon: FileText }
        ].map((item) => {
          const StepIcon = item.icon;
          return (
            <div key={item.stepNum} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                  step === item.stepNum
                    ? 'bg-accent-600 border-accent-500 text-white shadow-lg shadow-accent-600/15'
                    : step > item.stepNum
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {step > item.stepNum ? <Check className="w-4 h-4" /> : item.stepNum}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step === item.stepNum ? 'text-white' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {item.stepNum < 3 && <ArrowRight className="w-3.5 h-3.5 text-slate-700 hidden sm:inline ml-auto" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1: UPLOAD WIZARD */}
      {step === 1 && (
        <form onSubmit={handlePdfUpload} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-900/20 ${
                file
                  ? 'border-accent-500/50 bg-accent-500/[0.02]'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/30'
              }`}
            >
              <input
                type="file"
                id="pdf-file"
                accept=".pdf"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setUploadError('');
                }}
                className="hidden"
              />
              <label htmlFor="pdf-file" className="cursor-pointer flex flex-col items-center">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-accent-500 mb-4 shadow-xl">
                  <Upload className="w-8 h-8" />
                </div>
                {file ? (
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to parse
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">Drag and Drop PDF here</p>
                    <p className="text-xs text-slate-400">or click to browse from system explorer</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">Max upload limit: 10MB</p>
                  </div>
                )}
              </label>
            </div>

            {uploadError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Config sidebar card mapping course */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 self-start bg-slate-900/35">
            <h3 className="font-bold text-white text-base">Target Placement</h3>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Map to Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none text-white font-medium"
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={uploading || !file || !selectedCourse}
              className="w-full py-2.5 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting PDF Text...</span>
                </>
              ) : (
                <>
                  <span>Extract & Parse PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: CONFIGURE AI */}
      {step === 2 && pdfData && (
        <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-base">Extracted File Context</h3>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">File Name: <span className="text-white font-medium text-xs normal-case">{pdfData.pdfName}</span></p>
                <p className="text-xs font-semibold text-slate-400 uppercase">Text parsed: <span className="text-white font-medium text-xs normal-case">{pdfData.characterCount} characters</span></p>
              </div>
            </div>

            {/* AI Custom Keys Settings Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowApiConfig(!showApiConfig)}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">AI Engine Settings</h3>
                    <p className="text-xs text-slate-400">Configure custom API Keys to generate high-quality questions using real AI engines.</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-bold hover:text-white transition-colors">
                  {showApiConfig ? 'Hide' : 'Configure Keys'}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 pt-1">
                {(geminiKey || openaiKey) ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Real AI Mode Active (Local Keys)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    Mock Fallback Mode / Default Server Key
                  </span>
                )}
              </div>

              {showApiConfig && (
                <div className="pt-4 border-t border-slate-800/60 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gemini Key */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Google Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500">
                        Get a free key from the{' '}
                        <a 
                          href="https://aistudio.google.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-accent-400 hover:underline"
                        >
                          Google AI Studio Portal
                        </a>.
                      </p>
                    </div>

                    {/* OpenAI Key */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-proj-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500">
                        Get a standard developer key from your OpenAI Dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiKey('');
                        setOpenaiKey('');
                        localStorage.removeItem('gemini_key');
                        localStorage.removeItem('openai_key');
                        alert('API keys cleared!');
                      }}
                      className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-800"
                    >
                      Clear Keys
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveApiKeys}
                      className="px-4 py-1.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-accent-500/5"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Prompts Parameters Form */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <h3 className="font-bold text-white text-base">Generation Rules</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Question Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Question Category</label>
                  <select
                    value={config.type}
                    onChange={(e) => setConfig({ ...config, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none text-white font-medium"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="fill_in_the_blank">Fill in the Blanks</option>
                    <option value="short_question">Short Questions</option>
                    <option value="long_question">Essay / Long Questions</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Complexity / Difficulty</label>
                  <select
                    value={config.difficulty}
                    onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none text-white font-medium"
                  >
                    <option value="easy">Easy (Definitions & Facts)</option>
                    <option value="medium">Medium (Applications & Logic)</option>
                    <option value="hard">Hard (Advanced Math & Design)</option>
                  </select>
                </div>

                {/* Count */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Number of Questions</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.count}
                    onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none text-white font-medium"
                  />
                </div>
              </div>

              {genError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{genError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action sidebar */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 self-start bg-slate-900/35">
            <h3 className="font-bold text-white text-base">Actions</h3>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 disabled:from-slate-850 disabled:to-slate-850 disabled:text-slate-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>AI Prompt Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Prompt AI Generator</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl transition-all border border-slate-800 cursor-pointer"
            >
              Back
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PREVIEW & EXPORT */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Preview Pane */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg">AI Generated Questions Roster ({questions.length})</h3>
              <span className="text-[10px] text-accent-400 font-bold uppercase tracking-wider bg-accent-600/10 px-2.5 py-1 rounded-full">
                Difficulty: {config.difficulty}
              </span>
            </div>

            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          Q{i + 1} &bull; {q.type}
                        </span>
                        <h4 className="font-semibold text-white text-sm mt-2 leading-relaxed">{q.questionText}</h4>
                      </div>
                      
                      {/* Edit / Delete Options */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(i)}
                          className="p-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(i)}
                          className="p-1.5 bg-slate-950 border border-slate-850 hover:border-rose-700/40 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* MCQ Options representation */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-2">
                        {q.options.map((opt, oIndex) => {
                          const isCorrect = q.correctAnswer === oIndex.toString() || q.correctAnswer === opt;
                          return (
                            <div
                              key={oIndex}
                              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-medium'
                                  : 'bg-slate-950/45 border-slate-850 text-slate-400'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                                isCorrect
                                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                                  : 'border-slate-800 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + oIndex)}
                              </div>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Correct Answers representation for other types */}
                    {!q.options && q.correctAnswer && (
                      <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl text-xs space-y-1.5">
                        <p className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider">Correct Answer Reference:</p>
                        <p className="text-slate-350 leading-relaxed font-mono text-[11px]">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center">All questions deleted. Configure or regenerate to get a new list.</p>
            )}
          </div>

          {/* Action sidebar pane */}
          <div
            className="p-6 rounded-3xl space-y-5 self-start"
            style={{
              background: 'rgba(8,20,48,0.85)',
              border: '1px solid rgba(34,211,238,0.14)',
              boxShadow: '0 8px 32px rgba(6,182,212,0.08)'
            }}
          >
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Save & Export
            </h3>

            <div className="space-y-4">
              {/* Exam title configure */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-sky-500 uppercase tracking-wider">Exam Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none text-white font-medium"
                  style={{
                    background: 'rgba(6,182,212,0.05)',
                    border: '1px solid rgba(34,211,238,0.18)'
                  }}
                  onFocus={e => e.target.style.borderColor='rgba(34,211,238,0.45)'}
                  onBlur={e => e.target.style.borderColor='rgba(34,211,238,0.18)'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-sky-500 uppercase tracking-wider">Paper Type</label>
                  <select
                    value={config.paperType}
                    onChange={(e) => setConfig({ ...config, paperType: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none text-white font-medium"
                    style={{
                      background: 'rgba(6,182,212,0.05)',
                      border: '1px solid rgba(34,211,238,0.18)'
                    }}
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final Exam</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-sky-500 uppercase tracking-wider">Total Marks</label>
                  <input
                    type="number"
                    value={config.totalMarks}
                    onChange={(e) => setConfig({ ...config, totalMarks: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none text-white font-medium"
                    style={{
                      background: 'rgba(6,182,212,0.05)',
                      border: '1px solid rgba(34,211,238,0.18)'
                    }}
                  />
                </div>
              </div>

              {/* LMS Quiz Portal Config — MCQ only */}
              {config.type === 'mcq' && (
                <div
                  className="p-4 rounded-xl space-y-3"
                  style={{
                    background: 'rgba(34,211,238,0.04)',
                    border: '1px solid rgba(34,211,238,0.14)'
                  }}
                >
                  <h4 className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    LMS Quiz Portal Config
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[8px] font-bold text-sky-600 uppercase mb-1">Time (Mins)</label>
                      <input
                        type="number"
                        value={config.duration}
                        onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 rounded text-[10px] outline-none text-white"
                        style={{background:'rgba(8,20,48,0.9)', border:'1px solid rgba(34,211,238,0.15)'}}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-sky-600 uppercase mb-1">Min Correct</label>
                      <input
                        type="number"
                        value={config.passingMarks}
                        onChange={(e) => setConfig({ ...config, passingMarks: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 rounded text-[10px] outline-none text-white"
                        style={{background:'rgba(8,20,48,0.9)', border:'1px solid rgba(34,211,238,0.15)'}}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveQuiz}
                    disabled={questions.length === 0 || saveStatus === 'saving'}
                    className="w-full py-2 text-cyan-400 font-semibold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{background:'rgba(34,211,238,0.07)', border:'1px solid rgba(34,211,238,0.20)'}}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Publish as Live Quiz
                  </button>
                </div>
              )}

              {/* ─── MAIN SAVE BUTTON ─── */}
              <button
                type="button"
                onClick={handleSavePaper}
                disabled={questions.length === 0 || saveStatus === 'saving'}
                className="w-full py-2.5 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: saveStatus === 'success'
                    ? 'linear-gradient(135deg, #059669, #34d399)'
                    : 'linear-gradient(135deg, #0891b2, #22d3ee)',
                  boxShadow: saveStatus === 'success'
                    ? '0 6px 24px rgba(52,211,153,0.25)'
                    : '0 6px 24px rgba(34,211,238,0.25)'
                }}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Paper...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Save Exam Paper</span>
                  </>
                )}
              </button>

              {/* Export PDF */}
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={exporting || questions.length === 0}
                className="w-full py-2 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                style={{background:'rgba(6,182,212,0.08)', border:'1px solid rgba(34,211,238,0.18)'}}
              >
                {exporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Exam PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(2); setSaveStatus(''); }}
                className="w-full py-2 text-sky-500 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                style={{background:'rgba(6,182,212,0.04)', border:'1px solid rgba(34,211,238,0.10)'}}
              >
                ← Back to Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT QUESTION DIALOG MODAL */}
      {editingIndex !== null && editQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Exam Question</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Question Prompt</label>
                <textarea
                  value={editQuestion.questionText}
                  onChange={(e) => setEditQuestion({ ...editQuestion, questionText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white h-20"
                />
              </div>

              {/* Edit MCQ Choices */}
              {editQuestion.options && editQuestion.options.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">Modify Choices</label>
                  <div className="grid grid-cols-2 gap-3">
                    {editQuestion.options.map((opt, optIdx) => (
                      <div key={optIdx} className="space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Choice {String.fromCharCode(65 + optIdx)}</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updatedOpts = [...editQuestion.options];
                            updatedOpts[optIdx] = e.target.value;
                            setEditQuestion({ ...editQuestion, options: updatedOpts });
                          }}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Correct Option Index</span>
                    <select
                      value={editQuestion.correctAnswer}
                      onChange={(e) => setEditQuestion({ ...editQuestion, correctAnswer: e.target.value })}
                      className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-xs outline-none text-white focus:border-accent-500"
                    >
                      <option value="0">Choice A</option>
                      <option value="1">Choice B</option>
                      <option value="2">Choice C</option>
                      <option value="3">Choice D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Edit text answer reference */}
              {!editQuestion.options && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Reference Answer</label>
                  <textarea
                    value={editQuestion.correctAnswer || ''}
                    onChange={(e) => setEditQuestion({ ...editQuestion, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white h-20"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 p-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(null);
                  setEditQuestion(null);
                }}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-850 text-slate-350 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPaperGenerator;
