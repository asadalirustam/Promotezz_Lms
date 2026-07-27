import React from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const { darkMode, toggleTheme } = useTheme();

  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sm:px-8 transition-colors duration-200"
      style={{
        background: darkMode ? '#1E293B' : '#FFFFFF',
        borderBottom: darkMode ? '1px solid #334155' : '1px solid #E2E8F0',
        boxShadow: '0 1px 8px rgba(37,99,235,0.06)'
      }}
    >
      {/* Page Title */}
      <div>
        <h2 className="text-base font-bold tracking-wide" style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>
          Welcome back,{' '}
          <span className="font-extrabold" style={{ color: '#2563EB' }}>
            {user?.name || 'User'}
          </span>
        </h2>
        <p className="text-[10px] font-medium flex items-center gap-1 mt-0.5" style={{ color: darkMode ? '#94A3B8' : '#64748B' }}>
          <Sparkles className="w-3 h-3" style={{ color: '#7C3AED' }} />
          AI Department Learning Management System
        </p>
      </div>

      {/* Theme Toggle + Date + Status */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: darkMode ? '#0F172A' : '#F8FAFC',
            borderColor: darkMode ? '#334155' : '#E2E8F0',
            color: darkMode ? '#FDE68A' : '#2563EB'
          }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-amber-300">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline text-slate-700">Dark Mode</span>
            </>
          )}
        </button>

        {/* Live indicator */}
        <div className="hidden xs:flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#10B981' }}>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }}
          />
          <span className="hidden sm:inline">System Online</span>
        </div>

        {/* Date pill */}
        <div
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium"
          style={{
            background: darkMode ? '#0F172A' : '#EFF6FF',
            border: darkMode ? '1px solid #334155' : '1px solid #BFDBFE',
            color: '#2563EB'
          }}
        >
          <Calendar className="w-3.5 h-3.5" style={{ color: '#2563EB' }} />
          <span>{formatDate()}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
