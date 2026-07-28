import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Bell,
  LogOut,
  FolderOpen,
  Cpu,
  Calendar,
  Sparkles,
  Compass,
  MessageSquare,
  Contact,
  Navigation,
  Shield,
  DollarSign
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const { darkMode } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getLinks = () => {
    switch (user?.role) {
      case 'student':
        return [
          { name: 'Dashboard',       path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Courses',      path: '/courses',   icon: BookOpen },
          { name: 'Weekly Timetable',path: '/timetable', icon: Calendar },
          { name: 'AI Career Advisor', path: '/career-advisor', icon: Compass },
          { name: 'AI Study Planner', path: '/study-planner', icon: Calendar },
          { name: 'Exam Prep Center', path: '/exam-prep', icon: Sparkles },
          { name: 'Degree Predictor', path: '/semester-predictor', icon: BarChart3 },
          { name: 'Campus Navigator', path: '/campus-navigation', icon: Navigation },
          { name: 'Digital ID Pass',  path: '/digital-id', icon: Contact },
          { name: 'Workspace Chat',   path: '/chat', icon: MessageSquare },
          { name: 'Notice Board',    path: '/notices',   icon: Bell },
          { name: 'AI Library',      path: '/resources', icon: FolderOpen }
        ];
      case 'teacher':
        return [
          { name: 'Dashboard',        path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Courses',       path: '/courses',   icon: BookOpen },
          { name: 'Weekly Timetable', path: '/timetable', icon: Calendar },
          { name: 'QR Attendance Scan', path: '/digital-id', icon: Contact },
          { name: 'Workspace Chat',    path: '/chat', icon: MessageSquare },
          { name: 'AI Paper Generator', path: '/generator', icon: Sparkles },
          { name: 'Notice Board',     path: '/notices',   icon: Bell },
          { name: 'Material Library', path: '/resources', icon: FolderOpen }
        ];
      case 'hod':
        return [
          { name: 'Dashboard',        path: '/dashboard', icon: LayoutDashboard },
          { name: 'Weekly Timetable', path: '/timetable', icon: Calendar },
          { name: 'QR Attendance Scan', path: '/digital-id', icon: Contact },
          { name: 'Workspace Chat',    path: '/chat', icon: MessageSquare },
          { name: 'Dept Analytics',   path: '/analytics', icon: BarChart3 },
          { name: 'Notices Panel',    path: '/notices',   icon: Bell }
        ];
      case 'admin':
        return [
          { name: 'Dashboard',        path: '/dashboard',   icon: LayoutDashboard },
          { name: 'Admin Panel',      path: '/admin-panel', icon: Cpu },
          { name: 'Weekly Timetable', path: '/timetable',   icon: Calendar },
          { name: 'User Directory',   path: '/users',       icon: Users },
          { name: 'QR Attendance Scan', path: '/digital-id', icon: Contact },
          { name: 'Workspace Chat',    path: '/chat', icon: MessageSquare },
          { name: 'Notice Manager',   path: '/notices',     icon: Bell }
        ];
      case 'examination_incharge':
        return [
          { name: 'Dashboard',        path: '/dashboard',           icon: LayoutDashboard },
          { name: 'Incharge Panel',   path: '/exam-incharge-panel', icon: Shield },
          { name: 'Notice Board',     path: '/notices',             icon: Bell },
          { name: 'Workspace Chat',    path: '/chat',                icon: MessageSquare }
        ];
      case 'accountant':
        return [
          { name: 'Dashboard',        path: '/dashboard',          icon: LayoutDashboard },
          { name: 'Finance Panel',    path: '/accountant-panel',   icon: DollarSign },
          { name: 'Notice Board',     path: '/notices',            icon: Bell },
          { name: 'Workspace Chat',   path: '/chat',               icon: MessageSquare }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  const roleBadge = {
    student: { bg: darkMode ? '#064E3B' : '#DCFCE7', color: darkMode ? '#34D399' : '#16A34A', border: darkMode ? '#059669' : '#86EFAC' },
    teacher: { bg: darkMode ? '#1E3A8A' : '#DBEAFE', color: darkMode ? '#60A5FA' : '#2563EB', border: darkMode ? '#1D4ED8' : '#93C5FD' },
    hod:     { bg: darkMode ? '#78350F' : '#FEF3C7', color: darkMode ? '#FBBF24' : '#D97706', border: darkMode ? '#B45309' : '#FCD34D' },
    admin:   { bg: darkMode ? '#7F1D1D' : '#FEE2E2', color: darkMode ? '#F87171' : '#DC2626', border: darkMode ? '#B91C1C' : '#FCA5A5' },
    examination_incharge: { bg: darkMode ? '#4C1D95' : '#F5F3FF', color: darkMode ? '#A78BFA' : '#7C3AED', border: darkMode ? '#6D28D9' : '#DDD6FE' },
    accountant: { bg: darkMode ? '#7C2D12' : '#FFF7ED', color: darkMode ? '#FB923C' : '#EA580C', border: darkMode ? '#C2410C' : '#FED7AA' }
  };
  const rb = roleBadge[user?.role] || roleBadge.teacher;

  return (
    <aside
      className="w-64 flex flex-col h-full shrink-0 transition-colors duration-200"
      style={{
        background: darkMode ? '#0F172A' : '#FFFFFF',
        borderRight: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0',
        boxShadow: '2px 0 16px rgba(37,99,235,0.06)'
      }}
    >
      {/* Brand Header */}
      <div
        className="h-16 flex items-center px-5 gap-3"
        style={{ borderBottom: darkMode ? '1px solid #1E293B' : '1px solid #E2E8F0' }}
      >
        <div
          className="p-2 rounded-xl flex items-center justify-center text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
        >
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-sm leading-tight tracking-tight" style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>AI Department</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5" style={{ color: '#2563EB' }}>LMS Portal</p>
        </div>
      </div>

      {/* User Info Card */}
      <div
        className="mx-4 mt-4 mb-2 p-4 rounded-2xl"
        style={{
          background: darkMode ? '#1E293B' : '#EFF6FF',
          border: darkMode ? '1px solid #334155' : '1px solid #BFDBFE'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-sm truncate" style={{ color: darkMode ? '#F8FAFC' : '#0F172A' }}>{user?.name || 'User'}</h4>
            <span
              className="text-[9px] font-bold capitalize px-2 py-0.5 rounded-full border"
              style={{ background: rb.bg, color: rb.color, borderColor: rb.border }}
            >
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 pb-2" style={{ color: darkMode ? '#64748B' : '#94A3B8' }}>Navigation</p>
        {links.map((link) => {
          const IconComp = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={({ isActive }) => isActive ? {
                background: darkMode ? '#1E293B' : '#EFF6FF',
                color: '#2563EB',
                border: darkMode ? '1px solid #3B82F6' : '1px solid #BFDBFE',
                boxShadow: '0 2px 8px rgba(37,99,235,0.10)'
              } : {
                color: darkMode ? '#94A3B8' : '#475569',
                border: '1px solid transparent'
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('EFF6FF') && !e.currentTarget.style.background.includes('1E293B')) {
                  e.currentTarget.style.background = darkMode ? '#1E293B' : '#F8FAFC';
                  e.currentTarget.style.color = darkMode ? '#F8FAFC' : '#0F172A';
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('EFF6FF') && !e.currentTarget.style.background.includes('1E293B')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = darkMode ? '#94A3B8' : '#475569';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <IconComp
                    className="w-4 h-4 shrink-0"
                    style={{ color: isActive ? '#2563EB' : '#94A3B8' }}
                  />
                  <span>{link.name}</span>
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: '#2563EB' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3" style={{ borderTop: '1px solid #E2E8F0' }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{ color: '#EF4444', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
