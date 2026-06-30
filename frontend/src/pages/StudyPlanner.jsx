import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, BookOpen, Brain, Zap, Save, RefreshCw, Layers } from 'lucide-react';

const StudyPlanner = () => {
  const [subjects, setSubjects] = useState('');
  const [examDate, setExamDate] = useState('');
  const [weakTopics, setWeakTopics] = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState('');

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await api.get('/study-planner/current');
      if (res.data.success) {
        const data = res.data.data;
        setPlan(data.planData);
        setSubjects(data.subjects.join(', '));
        setExamDate(data.examDate.split('T')[0]);
        setWeakTopics(data.weakTopics.join(', '));
        setDailyHours(data.dailyHours);
      }
    } catch (err) {
      console.log('No active plan found yet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      const subArray = subjects.split(',').map(s => s.trim()).filter(Boolean);
      const weakArray = weakTopics.split(',').map(w => w.trim()).filter(Boolean);

      const res = await api.post('/study-planner/generate', {
        subjects: subArray,
        examDate,
        weakTopics: weakArray,
        dailyHours: parseInt(dailyHours)
      });

      if (res.data.success) {
        setPlan(res.data.data.planData);
        setMessage('AI Study Plan generated successfully!');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustom = async () => {
    if (!plan) return;
    try {
      setSavingPlan(true);
      const res = await api.put('/study-planner/customize', { planData: plan });
      if (res.data.success) {
        setMessage('Plan customized updates saved successfully!');
      }
    } catch (err) {
      setMessage('Failed to save customization details.');
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="space-y-8 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Layers className="w-3.5 h-3.5" />
            Adaptive Scheduling
          </span>
          <h1 className="text-3xl font-extrabold text-text-base leading-tight">AI Study Planner</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Construct structured study intervals, Pomodoro breaks schedules and weak-topic splits matching exam dates and committed workload parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Setup Parameters Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Planner Configuration
            </h3>
            {message && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${message.includes('success') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Target Subjects</label>
                <input
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base"
                  placeholder="e.g. Natural Language Processing, Math"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Target Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">My Weak Topics</label>
                <input
                  type="text"
                  value={weakTopics}
                  onChange={(e) => setWeakTopics(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base"
                  placeholder="e.g. Attention mechanism, backprop math"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Commitment (Hours/Day)</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary hover:opacity-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Generating...' : 'Re-Generate Study Plan'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Schedule Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="card-light p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Creating custom studying schedules...</p>
            </div>
          ) : plan ? (
            <div className="space-y-6">
              {/* Daily splits */}
              <div className="card-light p-6 space-y-4">
                <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Daily Plan Structure
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(plan.dailyPlan || {}).map(([sessionName, description]) => (
                    <div key={sessionName} className="p-4 rounded-xl border border-border-base bg-slate-50 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {sessionName}
                        </span>
                        <p className="text-xs text-slate-650 leading-relaxed font-medium">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly & Breaks grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly Milestones */}
                <div className="card-light p-6 space-y-4">
                  <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    Weekly Milestones
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(plan.weeklyPlan || {}).map(([week, goal]) => (
                      <div key={week} className="space-y-1">
                        <h4 className="font-semibold text-xs text-text-base">{week}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{goal}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaks & Revision */}
                <div className="space-y-6">
                  {/* Pomodoro Breaks */}
                  {plan.breakSchedule && (
                    <div className="card-light p-6 space-y-4 bg-primary/[0.02] border-primary/20">
                      <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-primary">
                        <Zap className="w-4 h-4 text-primary" />
                        Pomodoro Focus Breaks
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="bg-white p-3 rounded-lg border border-border-base">
                          <p className="text-slate-400 text-[9px] uppercase">Frequency</p>
                          <p className="text-text-base mt-1">{plan.breakSchedule.frequency}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-border-base">
                          <p className="text-slate-400 text-[9px] uppercase">Interval</p>
                          <p className="text-text-base mt-1">{plan.breakSchedule.duration}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-650 leading-relaxed italic bg-white p-3 rounded-xl border border-border-base font-medium">
                        Break activity: "{plan.breakSchedule.activity}"
                      </p>
                    </div>
                  )}

                  {/* Revision Checklist */}
                  <div className="card-light p-6 space-y-4">
                    <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                      <Brain className="w-4 h-4 text-warning" />
                      Revision Strategies
                    </h3>
                    <ul className="space-y-2">
                      {(plan.revisionPlan || []).map((rev, index) => (
                        <li key={index} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed font-medium">
                          <span className="text-warning mt-0.5">•</span>
                          <span>{rev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Custom Save */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveCustom}
                  disabled={savingPlan}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-primary/10"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPlan ? 'Saving...' : 'Save Plan to Profile'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card-light p-12 text-center text-slate-400">
              No active study planner setup yet. Fill config options on the left side to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner;
