import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Timer, AlertTriangle, ShieldAlert, Award, FileCheck, CheckCircle2, XCircle } from 'lucide-react';

const QuizInterface = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [attemptData, setAttemptData] = useState(null);

  // Active exam states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // Array: [{ questionId, selectedOption }]
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/${quizId}`);
        if (res.data.success) {
          setQuiz(res.data.data);
          setHasAttempted(res.data.hasAttempted);
          setAttemptData(res.data.attemptData);
          
          if (!res.data.hasAttempted) {
            setTimeLeft(res.data.data.duration * 60);
            
            // Initialize empty answers
            const initialAnswers = res.data.data.questions.map(q => ({
              questionId: q._id,
              selectedOption: -1
            }));
            setAnswers(initialAnswers);
          }
        }
      } catch (err) {
        console.error('Failed to load quiz details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // Timer countdown hook
  useEffect(() => {
    if (loading || hasAttempted || examSubmitted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit(); // Auto-submit when timer hits zero
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, hasAttempted, examSubmitted, timeLeft]);

  // Anti-cheating route warning
  useEffect(() => {
    if (loading || hasAttempted || examSubmitted) return;
    
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Warning: Active quiz attempt in progress. Leaving this page will submit a blank sheet.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, hasAttempted, examSubmitted]);

  const handleSelectOption = (questionId, optionIndex) => {
    const updated = answers.map(ans => {
      if (ans.questionId === questionId) {
        return { ...ans, selectedOption: optionIndex };
      }
      return ans;
    });
    setAnswers(updated);
  };

  const handleAutoSubmit = () => {
    alert('Timer expired! Submitting your answers automatically.');
    submitQuiz();
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/quizzes/${quizId}/submit`, { answers });
      if (res.data.success) {
        setSubmitResult(res.data.data);
        setExamSubmitted(true);
      }
    } catch (err) {
      alert('Failed to submit exam sheet');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RESULT VIEW ---
  if (examSubmitted || hasAttempted) {
    const finalScore = submitResult?.score !== undefined ? submitResult.score : attemptData?.score;
    const finalTotal = submitResult?.totalMarks !== undefined ? submitResult.totalMarks : quiz?.totalMarks;
    const isPass = submitResult?.passed !== undefined ? submitResult.passed : attemptData?.passed;

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6">
          <div className="flex justify-center">
            {isPass ? (
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-16 h-16" />
              </div>
            ) : (
              <div className="p-4 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                <XCircle className="w-16 h-16" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Quiz Evaluation Completed</h2>
            <p className="text-slate-400 text-sm">{quiz?.title}</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl max-w-sm mx-auto space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Final Score</p>
              <h1 className="text-4xl font-extrabold text-white mt-1">{finalScore} / {finalTotal}</h1>
            </div>
            
            <div className="h-px bg-slate-800"></div>

            <div>
              <span className={`inline-flex px-3.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                isPass 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}>
                {isPass ? 'Passed' : 'Failed'}
              </span>
              <p className="text-[10px] text-slate-400 mt-2">Passing Threshold: {quiz?.passingMarks} correct answers</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/courses/${quiz?.course}`)}
            className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all"
          >
            Return to Course Hub
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const activeAnswer = answers.find(ans => ans.questionId === currentQuestion?._id);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Exam Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
        <div>
          <h2 className="font-bold text-white text-sm leading-snug">{quiz?.title}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Assessment System</p>
        </div>

        {/* Floating Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold tracking-wide transition-all ${
          timeLeft < 60 
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-450 text-glow animate-soft' 
            : 'bg-slate-950 border-slate-800 text-slate-350'
        }`}>
          <Timer className="w-4.5 h-4.5 text-accent-500" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Warning Bar */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-2 flex items-center gap-2 text-amber-400 text-xs shrink-0 font-medium">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
        <span>Warning: Navigation focus is locked. Closing tab or refreshing page will auto-submit current choices.</span>
      </div>

      {/* Main Exam Interface */}
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-8 shadow-xl">
          {/* Question Index Progress */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Question {currentQuestionIndex + 1} of {quiz?.questions.length}</span>
            <span>Progress: {Math.round(((currentQuestionIndex + 1) / quiz?.questions.length) * 100)}%</span>
          </div>
          
          <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz?.questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white leading-relaxed">{currentQuestion?.questionText}</h3>
          </div>

          {/* MCQ Options Choices */}
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion?.options.map((option, idx) => {
              const isSelected = activeAnswer?.selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQuestion._id, idx)}
                  className={`w-full flex items-center justify-between p-4.5 rounded-xl border text-left text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent-600/10 border-accent-500 text-accent-400 shadow-md shadow-accent-500/5'
                      : 'bg-slate-950 border-slate-850 text-slate-350 hover:border-slate-750 hover:bg-slate-950/60'
                  }`}
                >
                  <span>{option}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-accent-500 bg-accent-500 text-white' : 'border-slate-800 bg-slate-900'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/60">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-4.5 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-750 disabled:opacity-30 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all"
            >
              Previous Question
            </button>

            {currentQuestionIndex === quiz?.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                className="px-6 py-2.5 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-lg shadow-accent-500/5"
              >
                Submit Exam Sheet
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="px-5 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-750 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizInterface;
