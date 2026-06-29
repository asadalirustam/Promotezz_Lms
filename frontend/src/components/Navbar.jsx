import React from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-8"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 8px rgba(37,99,235,0.06)'
      }}
    >
      {/* Page Title */}
      <div>
        <h2 className="text-base font-bold tracking-wide" style={{ color: '#0F172A' }}>
          Welcome back,{' '}
          <span className="font-extrabold" style={{ color: '#2563EB' }}>
            {user?.name || 'User'}
          </span>
        </h2>
        <p className="text-[10px] font-medium flex items-center gap-1 mt-0.5" style={{ color: '#64748B' }}>
          <Sparkles className="w-3 h-3" style={{ color: '#7C3AED' }} />
          AI Department Learning Management System
        </p>
      </div>

      {/* Date + Status */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#10B981' }}>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }}
          />
          System Online
        </div>

        {/* Date pill */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
          style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
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
