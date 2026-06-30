import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, CheckCircle, RefreshCw, Layers, Award, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

const ExamPrep = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState(null);
  const [progressMsg, setProgressMsg] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Practice States
  const [mcqAnswers, setMcqAnswers] = useState({}); // { [index]: option }
  const [tfAnswers, setTfAnswers] = useState({}); // { [index]: Boolean }
  const [shortDrafts, setShortDrafts] = useState({}); // { [index]: text }
  const [revealedShort, setRevealedShort] = useState({}); // { [index]: Boolean }
  const [flippedCards, setFlippedCards] = useState({}); // { [index]: Boolean }

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedCourse(res.data.data[0]._id);
          fetchPrepMaterial(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      }
    };
    loadCourses();
  }, []);

  const fetchPrepMaterial = async (courseId) => {
    try {
      setLoading(true);
      setPrepData(null);
      setProgressMsg('');
      const res = await api.get(`/exam-prep/course/${courseId}`);
      if (res.data.success) {
        setPrepData(res.data.data);
        setMcqAnswers({});
        setTfAnswers({});
        setShortDrafts({});
        setRevealedShort({});
        setFlippedCards({});
      }
    } catch (err) {
      console.log('No prep materials generated yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      setLoading(true);
      setProgressMsg('');
      const res = await api.post('/exam-prep/generate', {
        courseId: selectedCourse,
        topic
      });
      if (res.data.success) {
        setPrepData(res.data.data);
        setMcqAnswers({});
        setTfAnswers({});
        setShortDrafts({});
        setRevealedShort({});
        setFlippedCards({});
        setProgressMsg('Practice tests and flashcards compiled successfully!');
      }
    } catch (err) {
      setProgressMsg(err.response?.data?.message || 'Failed to generate materials.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current completion progress rate
  const calculateProgress = () => {
    if (!prepData) return 0;
    let totalItems = 0;
    let completedItems = 0;

    // Count MCQs answered
    if (prepData.practiceMCQs) {
      totalItems += prepData.practiceMCQs.length;
      completedItems += Object.keys(mcqAnswers).length;
    }

    // Count TF answered
    if (prepData.trueFalse) {
      totalItems += prepData.trueFalse.length;
      completedItems += Object.keys(tfAnswers).length;
    }

    // Count short drafts completed
    if (prepData.shortQuestions) {
      totalItems += prepData.shortQuestions.length;
      completedItems += Object.keys(shortDrafts).filter(k => shortDrafts[k].trim().length > 10).length;
    }

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const handleSyncProgress = async () => {
    if (!selectedCourse || !prepData) return;
    const progress = calculateProgress();

    try {
      setSyncing(true);
      setProgressMsg('');
      const res = await api.put(`/exam-prep/course/${selectedCourse}/progress`, { progress });
      if (res.data.success) {
        setProgressMsg(`Success: Study progress synced at ${progress}%!`);
        // Refresh local data
        setPrepData({ ...prepData, progress });
      }
    } catch (err) {
      setProgressMsg('Failed to sync study progress.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Exam Prep Center
          </span>
          <h1 className="text-3xl font-extrabold text-text-base leading-tight">Interactive Practice Portal</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Generate course practice tests, flashcards, MCQs, and draft short answers. Match your drafts against predicted keywords checks dynamically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup Config sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Practice Builder
            </h3>

            {progressMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${progressMsg.includes('Success') || progressMsg.includes('compiled') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                {progressMsg}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    fetchPrepMaterial(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base font-semibold"
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Topic / Focus Chapter</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base"
                  placeholder="e.g. Convolution mechanics, CNN layouts"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Compiling Practice...' : 'Generate AI Materials'}</span>
              </button>
            </form>
          </div>

          {/* Practice Progress Card */}
          {prepData && (
            <div className="card-light p-6 space-y-4">
              <h4 className="font-bold text-text-base text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-warning" />
                Preparation Tracker
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-text-base">
                  <span>Current Completion Status</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${calculateProgress()}%` }}></div>
                </div>
                <button
                  onClick={handleSyncProgress}
                  disabled={syncing}
                  className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-[10px] uppercase rounded-lg transition-all cursor-pointer"
                >
                  {syncing ? 'Syncing...' : 'Sync Progress & Earn XP'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Practice Panels output */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="card-light p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Generating MCQs and mock answers...</p>
            </div>
          ) : prepData ? (
            <div className="space-y-8">
              {/* 1. Practice MCQs */}
              {prepData.practiceMCQs && prepData.practiceMCQs.length > 0 && (
                <div className="card-light p-6 space-y-6">
                  <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Multiple Choice Questions
                  </h3>
                  <div className="space-y-6 divide-y divide-border-base/40">
                    {prepData.practiceMCQs.map((q, idx) => {
                      const selected = mcqAnswers[idx];
                      const isCorrect = selected === q.answer;
                      return (
                        <div key={idx} className={`space-y-3 ${idx > 0 ? 'pt-6' : ''}`}>
                          <p className="font-semibold text-xs text-text-base leading-relaxed">
                            {idx + 1}. {q.question}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            {q.options.map(opt => {
                              const isThisOpt = selected === opt;
                              let borderCls = 'border-border-base hover:border-slate-400 bg-white text-text-base';
                              if (isThisOpt) {
                                borderCls = isCorrect
                                  ? 'bg-success/10 border-success text-success font-bold'
                                  : 'bg-danger/10 border-danger text-danger font-bold';
                              }
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setMcqAnswers({ ...mcqAnswers, [idx]: opt })}
                                  className={`px-4 py-2.5 border rounded-xl text-left cursor-pointer transition-all ${borderCls}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {selected && (
                            <p className={`text-[10px] font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                              {isCorrect ? '✓ Correct Answer!' : `✗ Incorrect. Correct: "${q.answer}"`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Interactive Flashcards */}
              {prepData.flashcards && prepData.flashcards.length > 0 && (
                <div className="card-light p-6 space-y-4">
                  <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-secondary" />
                    Interactive Revision Flashcards
                  </h3>
                  <p className="text-xs text-slate-500">Click a card below to flip and reveal the definition/answer.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {prepData.flashcards.map((fc, idx) => {
                      const isFlipped = flippedCards[idx];
                      return (
                        <button
                          key={idx}
                          onClick={() => setFlippedCards({ ...flippedCards, [idx]: !isFlipped })}
                          className={`w-full min-h-32 p-6 rounded-2xl border text-center flex flex-col justify-center items-center transition-all duration-300 cursor-pointer shadow-sm ${isFlipped ? 'bg-secondary/5 border-secondary/35 text-secondary' : 'bg-white border-border-base text-text-base hover:border-slate-400'}`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            {isFlipped ? 'Answer Key' : 'Question Card'}
                          </span>
                          <p className="text-xs font-bold leading-relaxed">
                            {isFlipped ? fc.answer : fc.question}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Short Questions */}
              {prepData.shortQuestions && prepData.shortQuestions.length > 0 && (
                <div className="card-light p-6 space-y-6">
                  <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-warning" />
                    Short Questions & Keyword Matching
                  </h3>
                  <div className="space-y-6 divide-y divide-border-base/40">
                    {prepData.shortQuestions.map((q, idx) => {
                      const draft = shortDrafts[idx] || '';
                      const isRevealed = revealedShort[idx];
                      return (
                        <div key={idx} className={`space-y-3 ${idx > 0 ? 'pt-6' : ''}`}>
                          <p className="font-semibold text-xs text-text-base leading-relaxed">
                            {idx + 1}. {q.question}
                          </p>
                          <textarea
                            value={draft}
                            onChange={(e) => setShortDrafts({ ...shortDrafts, [idx]: e.target.value })}
                            className="w-full px-4 py-2 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base h-20 resize-none"
                            placeholder="Draft your explanation here (at least 10 characters)..."
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => setRevealedShort({ ...revealedShort, [idx]: !isRevealed })}
                              disabled={draft.trim().length < 10}
                              className="px-3 py-1 bg-slate-900 border border-slate-800 text-warning font-semibold text-[10px] uppercase rounded-lg hover:bg-slate-850 disabled:opacity-50 cursor-pointer"
                            >
                              {isRevealed ? 'Hide Check' : 'Reveal Expected Keywords'}
                            </button>
                          </div>
                          {isRevealed && (
                            <div className="p-3 bg-warning/5 border border-warning/20 rounded-xl space-y-2 text-xs">
                              <p className="font-bold text-warning flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Expected Core Grading Keywords:
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {q.keywords.map(kw => {
                                  const contains = draft.toLowerCase().includes(kw.toLowerCase());
                                  return (
                                    <span key={kw} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${contains ? 'bg-success/15 border-success text-success' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                      {kw} {contains ? '✓ Match' : '✗ Miss'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-light p-12 text-center text-slate-450">
              No prep material is loaded. Choose course parameters and click generate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPrep;
