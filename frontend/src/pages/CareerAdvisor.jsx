import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Compass, BookOpen, Award, CheckCircle, GraduationCap, ArrowRight, Save, User, RefreshCw, Star } from 'lucide-react';

const CareerAdvisor = () => {
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [gpa, setGpa] = useState('3.50');
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [profileMsg, setProfileMsg] = useState('');

  const fetchAdvice = async () => {
    try {
      setLoading(true);
      const res = await api.get('/career-advisor/recommend');
      if (res.data.success) {
        setGpa(res.data.gpa);
        setSkills(res.data.skills.join(', '));
        setInterests(res.data.interests.join(', '));
        setRecommendation(res.data.recommendation);
      }
    } catch (err) {
      console.error('Failed to get career advice', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg('');
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const interestsArray = interests.split(',').map(i => i.trim()).filter(Boolean);

      const res = await api.put('/career-advisor/profile', {
        skills: skillsArray,
        interests: interestsArray
      });

      if (res.data.success) {
        setProfileMsg('Skills and interests updated successfully!');
        fetchAdvice();
      }
    } catch (err) {
      setProfileMsg('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Compass className="w-3.5 h-3.5" />
            Decision Intelligence
          </span>
          <h1 className="text-3xl font-extrabold text-text-base leading-tight">AI Career Advisor</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Get personalized learning roadmaps, skills evaluations, certification suggestions, and job roles recommendations matched directly with your GPA, current semester, and interests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Advisor Profile Info
            </h3>
            {profileMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${profileMsg.includes('success') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Calculated CGPA</label>
                <div className="px-4 py-2.5 bg-bg-base border border-border-base rounded-xl font-bold text-text-base text-sm select-none">
                  {gpa} / 4.00
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">My Skills (Comma separated)</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base h-20 resize-none"
                  placeholder="e.g. Python, Machine Learning, Git"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">My Interests (Comma separated)</label>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base h-20 resize-none"
                  placeholder="e.g. Computer Vision, Robotics, Game Dev"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          <div className="card-light p-6 text-center space-y-4">
            <h4 className="font-bold text-text-base text-sm">Consult Career Engine</h4>
            <p className="text-xs text-slate-500">Run the Gemini model to re-analyze profile data, check for gaps, and refresh recommendations.</p>
            <button
              onClick={fetchAdvice}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Data...' : 'Generate New Report'}</span>
            </button>
          </div>
        </div>

        {/* Advisor Recommendations Output */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="card-light p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500 animate-pulse">Running Career Advisor model analysis...</p>
            </div>
          ) : recommendation ? (
            <div className="space-y-6">
              {/* Paths */}
              <div className="card-light p-6 space-y-4">
                <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-warning" />
                  Recommended Career Paths
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.recommendedPaths.map((path, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border-base bg-primary/5 flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">{path}</span>
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps / Missing Skills & Certs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Skills */}
                <div className="card-light p-6 space-y-4">
                  <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-danger">
                    <CheckCircle className="w-4 h-4 text-danger" />
                    Identified Gaps / Missing Skills
                  </h3>
                  <ul className="space-y-2">
                    {recommendation.missingSkills.map((s, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                        <span className="text-danger mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Certifications */}
                <div className="card-light p-6 space-y-4">
                  <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2 text-success">
                    <Award className="w-4 h-4 text-success" />
                    Top Certifications & Courses
                  </h3>
                  <ul className="space-y-2">
                    {(recommendation.certifications || []).concat(recommendation.onlineCourses || []).slice(0, 5).map((cert, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                        <span className="text-success mt-0.5">•</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Roadmap */}
              <div className="card-light p-6 space-y-4">
                <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-secondary" />
                  Personalized Learning Roadmap
                </h3>
                <div className="relative border-l-2 border-border-base pl-6 ml-3 space-y-6">
                  {recommendation.learningRoadmap.map((phase, idx) => (
                    <div key={idx} className="relative space-y-2">
                      {/* Indicator dot */}
                      <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-secondary flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      </span>
                      <h4 className="font-bold text-sm text-text-base">{phase.phase}</h4>
                      <ul className="space-y-1.5 pl-2">
                        {phase.actions.map((act, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                            <span className="text-secondary mt-0.5">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card-light p-12 text-center text-slate-400">
              No recommendations generated. Click "Generate Report" above to consult the AI Career Advisor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerAdvisor;
