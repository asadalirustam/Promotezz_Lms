import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import api from '../services/api';
import { Cpu, Mail, Lock, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { loading, isAuthenticated } = useSelector((state) => state.auth);
  const { darkMode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setErrorMessage('Please fill in all fields'); return; }
    try {
      dispatch(loginStart());
      setErrorMessage('');
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        dispatch(loginSuccess({ user: response.data.data, token: response.data.data.token }));
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      dispatch(loginFailure(msg));
      setErrorMessage(msg);
    }
  };

  const presets = [
    { label: 'Admin',   email: 'admin@ailms.edu',    pass: 'asadali456',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    { label: 'HOD',     email: 'hod@ailms.edu',      pass: 'hod123',      color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Exam Incharge', email: 'exam@ailms.edu', pass: 'exam123',   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: 'Accountant', email: 'accounts@ailms.edu', pass: 'accounts123', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
    { label: 'Teacher', email: 'sarah@ailms.edu',    pass: 'teacher123',  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Student', email: 'alex@ailms.edu',     pass: 'student123',  color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' }
  ];

  const handleInstantLogin = async (preset) => {
    const targetEmail = preset ? preset.email : 'admin@ailms.edu';
    const targetPass = preset ? preset.pass : 'asadali456';
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrorMessage('');
    try {
      dispatch(loginStart());
      const response = await api.post('/auth/login', { email: targetEmail, password: targetPass });
      if (response.data.success) {
        dispatch(loginSuccess({ user: response.data.data, token: response.data.data.token }));
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      dispatch(loginFailure(msg));
      setErrorMessage(msg);
    }
  };

  return (
    <div
      className="login-container min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden fast-gpu"
      style={{ background: darkMode ? 'linear-gradient(135deg, #0F172A 0%, #0B0F19 50%, #1E293B 100%)' : 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #DBEAFE 100%)' }}
    >
      {/* Theme Toggle Button Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          style={{
            background: darkMode ? '#1E293B' : '#FFFFFF',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            color: darkMode ? '#FDE68A' : '#2563EB'
          }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-700">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Ambient blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full pointer-events-none opacity-70 sm:opacity-100"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full pointer-events-none opacity-70 sm:opacity-100"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md z-10 mx-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div
            className="p-3 sm:p-3.5 rounded-2xl shadow-xl mb-3 sm:mb-4 smooth-fast-transition hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              boxShadow: '0 8px 32px rgba(37,99,235,0.30)'
            }}
          >
            <Cpu className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="brand-title text-xl sm:text-2xl font-bold tracking-wide" style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>
            Artificial Intelligence Dept
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>Learning Management System</p>
        </div>

        {/* Login Card */}
        <div
          className="login-card rounded-2xl p-6 sm:p-8 smooth-fast-transition"
          style={{
            background: darkMode ? '#1E293B' : '#FFFFFF',
            border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
            boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.40)' : '0 20px 60px rgba(37,99,235,0.10)'
          }}
        >
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold" style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>Account Login</h2>
            {/* Quick Demo One-Click Badge */}
            <button
              onClick={() => handleInstantLogin(presets[0])}
              className="text-[11px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                color: '#FFFFFF'
              }}
              title="One-Click Quick Admin Demo Login"
            >
              <span>⚡ Quick Demo</span>
            </button>
          </div>

          {errorMessage && (
            <div
              className="mb-4 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm animate-shake"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 sm:mb-2 uppercase tracking-wide" style={{ color: '#2563EB' }}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center" style={{ color: '#93C5FD' }}>
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none smooth-fast-transition"
                  style={{
                    background: darkMode ? '#0F172A' : '#F8FAFC',
                    border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                    color: darkMode ? '#F8FAFC' : '#0F172A'
                  }}
                  placeholder="name@ailms.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 sm:mb-2 uppercase tracking-wide" style={{ color: '#2563EB' }}>
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center" style={{ color: '#93C5FD' }}>
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none smooth-fast-transition"
                  style={{
                    background: darkMode ? '#0F172A' : '#F8FAFC',
                    border: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
                    color: darkMode ? '#F8FAFC' : '#0F172A'
                  }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 text-white font-semibold text-sm rounded-xl cursor-pointer smooth-fast-transition flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                boxShadow: '0 8px 24px rgba(37,99,235,0.30)'
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <> <span>Sign In</span> <ArrowRight className="w-4 h-4" /> </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 sm:mt-7 pt-5 sm:pt-6" style={{ borderTop: darkMode ? '1px solid #334155' : '1px solid #E2E8F0' }}>
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
                🚀 Quick Demo Roles (1-Click Login)
              </p>
              <span className="text-[9px] font-semibold text-primary">Click any role to log in</span>
            </div>

            <div className="preset-grid grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleInstantLogin(p)}
                  className="preset-btn px-2.5 sm:px-3 py-2 text-[11px] font-medium rounded-xl smooth-fast-transition text-left cursor-pointer active:scale-95 hover:scale-[1.03]"
                  style={{
                    background: darkMode ? '#0F172A' : p.bg,
                    border: `1px solid ${darkMode ? '#334155' : p.border}`
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 14px ${p.color}33`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  title={`1-Click Login as ${p.label}`}
                >
                  <span className="font-extrabold block text-[11px]" style={{ color: p.color }}>{p.label}</span>
                  <span className="block text-[8px] truncate mt-0.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>{p.email}</span>
                  <span className="block text-[8px] font-mono font-bold mt-0.5" style={{ color: p.color }}>Pass: {p.pass}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
