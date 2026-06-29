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
    { label: 'Admin',   email: 'admin@ailms.edu', pass: 'admin123',   color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    { label: 'HOD',     email: 'hod@ailms.edu',   pass: 'hod123',     color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Teacher', email: 'sarah@ailms.edu', pass: 'teacher123', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Student', email: 'alex@ailms.edu',  pass: 'student123', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' }
  ];

  const handleApplyPreset = (p) => { setEmail(p.email); setPassword(p.pass); setErrorMessage(''); };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #DBEAFE 100%)' }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="p-3.5 rounded-2xl shadow-xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              boxShadow: '0 8px 32px rgba(37,99,235,0.30)'
            }}
          >
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#0F172A' }}>Artificial Intelligence Dept</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Learning Management System</p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 60px rgba(37,99,235,0.10)'
          }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#0F172A' }}>Account Login</h2>

          {errorMessage && (
            <div
              className="mb-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#2563EB' }}>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#EFF6FF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                  placeholder="name@ailms.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#2563EB' }}>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#EFF6FF'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
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

          {/* Demo Presets */}
          <div className="mt-7 pt-6" style={{ borderTop: '1px solid #E2E8F0' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>Quick Demo Logins</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-2 text-[11px] font-medium rounded-lg transition-all text-left cursor-pointer"
                  style={{ background: p.bg, border: `1px solid ${p.border}` }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 12px ${p.color}22`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <span className="font-bold block" style={{ color: p.color }}>{p.label}</span>
                  <span className="block text-[9px] truncate" style={{ color: '#94A3B8' }}>{p.email}</span>
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
