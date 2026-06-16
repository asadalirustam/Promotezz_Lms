import React from 'react';
import { useSelector } from 'react-redux';
import { Calendar } from 'lucide-react';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
      {/* Page Title Context */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">
          Welcome back, <span className="text-accent-400 font-semibold">{user?.name || 'User'}</span>
        </h2>
        <p className="text-[11px] text-slate-400">AI Department LMS Platform</p>
      </div>

      {/* Date Widget */}
      <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 text-xs">
        <Calendar className="w-4 h-4 text-accent-500" />
        <span>{formatDate()}</span>
      </div>
    </header>
  );
};

export default Navbar;
