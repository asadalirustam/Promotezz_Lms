import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Bell,
  LogOut,
  FolderOpen,
  Cpu,
  GraduationCap
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
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
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Courses', path: '/courses', icon: BookOpen },
          { name: 'Notice Board', path: '/notices', icon: Bell },
          { name: 'AI Library', path: '/resources', icon: FolderOpen }
        ];
      case 'teacher':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Courses', path: '/courses', icon: BookOpen },
          { name: 'Notice Board', path: '/notices', icon: Bell },
          { name: 'Material Library', path: '/resources', icon: FolderOpen }
        ];
      case 'hod':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Dept Analytics', path: '/analytics', icon: BarChart3 },
          { name: 'Notices Panel', path: '/notices', icon: Bell }
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'User Directory', path: '/users', icon: Users },
          { name: 'Notice Manager', path: '/notices', icon: Bell }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
        <div className="p-1.5 bg-accent-600 rounded-lg flex items-center justify-center text-white">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight text-white">AI Department</h1>
          <p className="text-[10px] text-accent-400 font-semibold uppercase tracking-wider">LMS Portal</p>
        </div>
      </div>

      {/* User Information */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-accent-400 font-bold">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-white">{user?.name || 'User'}</h4>
            <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-accent-500" />
              {user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const IconComp = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-600/10 text-accent-400 border-l-2 border-accent-500'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <IconComp className="w-5 h-5 shrink-0" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
