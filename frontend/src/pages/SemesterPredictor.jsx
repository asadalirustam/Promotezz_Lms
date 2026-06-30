import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LineChart, Sparkles, Award, GraduationCap, AlertCircle, Compass, HelpCircle, CheckCircle, BarChart2 } from 'lucide-react';

const SemesterPredictor = () => {
  const [degreeStatus, setDegreeStatus] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('tracker'); // 'tracker' or 'predictor'

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch degree tracker status
      const trackerRes = await api.get('/degree-tracker/status');
      if (trackerRes.data.success) {
        setDegreeStatus(trackerRes.data.data);
      }

      // Fetch semester prediction
      const predictRes = await api.get('/semester-predictor/predict');
      if (predictRes.data.success) {
        setPrediction(predictRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load performance metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <GraduationCap className="w-3.5 h-3.5" />
            Academic forecasting
          </span>
          <h1 className="text-3xl font-extrabold text-text-base leading-tight">Degree Audit & Semester Predictor</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Audit your credit hours progress, monitor graduation timelines, and run predictive analytics forecasts to preview semester GPAs and mitigate academic risks.
          </p>
        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex border-b border-border-base gap-6">
        {[
          { id: 'tracker', label: 'Degree Progress Auditor', icon: GraduationCap },
          { id: 'predictor', label: 'AI Grade Predictor Forecasts', icon: Sparkles }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeSubTab === t.id ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{t.label}</span>
              {activeSubTab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="card-light p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Calculating rolling grade-points averages...</p>
        </div>
      ) : activeSubTab === 'tracker' && degreeStatus ? (
        /* Degree Tracker Tab */
        <div className="space-y-8 animate-soft">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progress Circular indicator Box */}
            <div className="card-light p-6 flex flex-col items-center justify-center text-center space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Degree Completion Rate</h4>
              
              {/* SVG circular indicator */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - degreeStatus.graduationPercentage / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute font-extrabold text-2xl text-text-base">
                  {degreeStatus.graduationPercentage}%
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-bold uppercase">
                {degreeStatus.completedCredits} / {degreeStatus.totalCreditsRequired} Credits Completed
              </div>
            </div>

            {/* Credit Breakdown */}
            <div className="card-light p-6 flex flex-col justify-between">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Degree Audit breakdown</h4>
              <div className="space-y-3 font-semibold text-xs text-text-base pt-4">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Total Credits Needed</span>
                  <span>{degreeStatus.totalCreditsRequired} Credits</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Completed Credits</span>
                  <span className="text-primary">{degreeStatus.completedCredits} Credits</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Credits Remaining</span>
                  <span className="text-secondary">{degreeStatus.remainingCredits} Credits</span>
                </div>
              </div>
            </div>

            {/* Graduation Date Prediction */}
            <div className="card-light p-6 flex flex-col justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Graduation Date</h4>
              <div className="text-center py-6">
                <p className="text-2xl font-black text-text-base tracking-tight">{degreeStatus.expectedGraduationDate}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Predicted Audit Timeline</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg text-[10px] font-bold text-slate-500 text-center uppercase">
                Calculated on completed milestones
              </div>
            </div>
          </div>

          {/* Subjects completed & remaining lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-light p-6 space-y-4">
              <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-success">
                <CheckCircle className="w-4 h-4 text-success" />
                Completed Subjects List
              </h3>
              {degreeStatus.completedSubjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {degreeStatus.completedSubjects.map(sub => (
                    <div key={sub} className="p-3 bg-success/5 border border-success/20 rounded-xl text-xs font-semibold text-success">
                      ✓ {sub}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No subjects completed yet.</p>
              )}
            </div>

            <div className="card-light p-6 space-y-4">
              <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-primary">
                <HelpCircle className="w-4 h-4 text-primary" />
                Syllabus Courses Remaining
              </h3>
              {degreeStatus.remainingSubjects.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {degreeStatus.remainingSubjects.map(sub => (
                    <div key={sub} className="p-3 bg-bg-base border border-border-base rounded-xl text-xs font-semibold text-slate-650">
                      • {sub}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Perfect status. All courses audited!</p>
              )}
            </div>
          </div>
        </div>
      ) : prediction ? (
        /* AI Predictor Tab */
        <div className="space-y-8 animate-soft">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-light p-6 text-center space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Predicted Semester GPA</p>
              <h2 className="text-3xl font-extrabold text-primary pt-2">{prediction.expectedGPA}</h2>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2">Out of 4.00</div>
            </div>

            <div className="card-light p-6 text-center space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Forecasted Cumulative CGPA</p>
              <h2 className="text-3xl font-extrabold text-secondary pt-2">{prediction.expectedCGPA}</h2>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2"> audit prediction</div>
            </div>

            <div className="card-light p-6 text-center space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Sem Pass Probability</p>
              <h2 className="text-3xl font-extrabold text-success pt-2">{prediction.passProbability}%</h2>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2">Low academic risk</div>
            </div>

            <div className="card-light p-6 text-center space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Attendance Risk</p>
              <h2 className="text-base font-black text-text-base pt-3.5 leading-tight">{prediction.attendanceRisk}</h2>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-2">Calculated daily</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Risk warning & suggestions */}
            <div className="md:col-span-1 space-y-6">
              {/* Risk list */}
              <div className="card-light p-6 space-y-4">
                <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-danger">
                  <AlertCircle className="w-4 h-4 text-danger" />
                  Identified Risk Courses
                </h3>
                {prediction.riskSubjects.length > 0 ? (
                  <div className="space-y-3">
                    {prediction.riskSubjects.map(sub => (
                      <div key={sub} className="p-3 bg-danger/5 border border-danger/25 text-danger text-xs font-semibold rounded-xl">
                        {sub}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-success/5 border border-success/20 text-success text-xs font-semibold rounded-xl text-center">
                    ✓ All courses hover above average safety criteria.
                  </div>
                )}
              </div>

              {/* Trend */}
              <div className="card-light p-6 space-y-3">
                <h4 className="font-bold text-text-base text-xs uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Performance Trajectory
                </h4>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold italic bg-slate-55 p-3 rounded-xl border border-border-base">
                  "{prediction.performanceTrend}"
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="md:col-span-2 space-y-6">
              <div className="card-light p-6 space-y-4">
                <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  Forecaster Improvement Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prediction.suggestions.map((sug, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-border-base text-xs font-medium text-slate-650 leading-relaxed flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CGPA Progress chart visualization (Simulated line bar) */}
              <div className="card-light p-6 space-y-4">
                <h3 className="font-bold text-text-base text-sm uppercase tracking-wider">
                  CGPA Timeline Audits
                </h3>
                <div className="flex items-end justify-between h-40 pt-6 border-b border-border-base px-6">
                  {degreeStatus?.cgpaProgress?.map((p, idx) => {
                    const heightPercent = Math.round((p.gpa / 4.0) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary transition-all">{p.gpa}</span>
                        <div
                          className="w-8 bg-gradient-to-t from-primary to-blue-450 rounded-t-lg transition-all duration-500 ease-out group-hover:to-accent-400 cursor-pointer"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[8px] font-bold text-slate-450 uppercase whitespace-nowrap">{p.semester}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-light p-12 text-center text-slate-400">
          Failed to load forecaster metrics. Check your database connections or enrollments list.
        </div>
      )}
    </div>
  );
};

export default SemesterPredictor;
