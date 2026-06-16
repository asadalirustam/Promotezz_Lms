import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import api from '../services/api';
import { Cpu, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { loading, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    try {
      dispatch(loginStart());
      setErrorMessage('');
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        dispatch(loginSuccess({
          user: response.data.data,
          token: response.data.data.token
        }));
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      dispatch(loginFailure(msg));
      setErrorMessage(msg);
    }
  };

  // Mock users presets list for easy testing
  const presets = [
    { label: 'Admin', email: 'admin@ailms.edu', pass: 'admin123' },
    { label: 'HOD', email: 'hod@ailms.edu', pass: 'hod123' },
    { label: 'Teacher', email: 'sarah@ailms.edu', pass: 'teacher123' },
    { label: 'Student', email: 'alex@ailms.edu', pass: 'student123' }
  ];

  const handleApplyPreset = (p) => {
    setEmail(p.email);
    setPassword(p.pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px] animate-soft"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-soft" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-accent-600 to-indigo-500 rounded-2xl shadow-lg shadow-accent-500/10 mb-4 animate-bounce">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Artificial Intelligence Dept</h1>
          <p className="text-sm text-slate-400 mt-1">Learning Management System</p>
        </div>

        {/* Login Panel */}
        <div className="glass-panel rounded-2xl p-8 border border-slate-800 shadow-xl relative">
          <h2 className="text-xl font-semibold text-white mb-6">Account Login</h2>

          {errorMessage && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none rounded-xl text-sm transition-all placeholder:text-slate-600"
                  placeholder="name@ailms.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none rounded-xl text-sm transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl cursor-pointer transition-all duration-300 shadow-md shadow-accent-500/10 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick presets for evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-800/60">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Demo Logins</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-medium rounded-lg text-slate-300 transition-all text-left cursor-pointer"
                >
                  <span className="text-accent-400 font-semibold">{p.label}</span>
                  <span className="block text-[9px] text-slate-500 truncate">{p.email}</span>
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
