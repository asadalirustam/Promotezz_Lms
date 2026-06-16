import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  BookOpen,
  Users,
  FileText,
  AlertTriangle,
  FolderMinus,
  Percent,
  Award,
  GraduationCap,
  Clock,
  ChevronRight,
  TrendingUp,
  Cpu,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const endpoint = `/analytics/${user.role}`;
        const response = await api.get(endpoint);
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role) {
      fetchDashboardStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- STUDENT DASHBOARD VIEW ---
  if (user?.role === 'student') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
          <p className="text-sm text-slate-400">Track your courses, attendance, GPA, and upcoming due dates.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalCourses || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.attendanceRate || 85}%</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target GPA</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.gpa || '3.50'}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Submissions</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.completedSubmissions || 0}</h3>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Assignments */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-500" />
                Upcoming Deadlines
              </h3>
              <span className="text-[10px] text-accent-400 font-bold uppercase tracking-wider bg-accent-600/10 px-2.5 py-1 rounded-full">
                Pending Actions
              </span>
            </div>
            {stats?.upcomingAssignments && stats.upcomingAssignments.length > 0 ? (
              <div className="divide-y divide-slate-800/60">
                {stats.upcomingAssignments.map((assign) => (
                  <div key={assign._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{assign.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{assign.course?.name} ({assign.course?.code})</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[11px] text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg font-medium">
                        Due: {new Date(assign.dueDate).toLocaleDateString()}
                      </span>
                      <Link
                        to={`/courses/${assign.course?._id}`}
                        className="text-slate-400 hover:text-white transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No upcoming assignments due. Great job!</p>
            )}
          </div>

          {/* Quick Links / Resources */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="font-bold text-white">AI Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/courses"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-accent-500" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">View Courses</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
              <Link
                to="/resources"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FolderMinus className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">AI Datasets & Papers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TEACHER DASHBOARD VIEW ---
  if (user?.role === 'teacher') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
          <p className="text-sm text-slate-400">Coordinate courses, mark classroom roll counts, and review submissions.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Courses</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalCourses || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students Enrolled</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalStudents || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignments Created</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalAssignments || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Grading</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.pendingSubmissions || 0}</h3>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submissions Pending Grading */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Submissions Requiring Grading
            </h3>
            {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Student</th>
                      <th className="pb-3 font-semibold">Assignment</th>
                      <th className="pb-3 font-semibold">Submitted Date</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {stats.recentSubmissions.map((sub) => (
                      <tr key={sub._id} className="text-slate-300">
                        <td className="py-3 font-medium text-white">{sub.student?.name}</td>
                        <td className="py-3">{sub.assignment?.title}</td>
                        <td className="py-3">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/courses/${sub.assignment?.course}`}
                            className="inline-flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 font-semibold bg-accent-500/10 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <span>Open Gradebook</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">All submissions are graded! Great work.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white">Course Controls</h3>
            <div className="space-y-3">
              <Link
                to="/courses"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-accent-500" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Manage My Courses</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
              <Link
                to="/notices"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Post Notice Board</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- HOD DASHBOARD VIEW ---
  if (user?.role === 'hod') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">HOD Dashboard</h1>
          <p className="text-sm text-slate-400">Department metrics, grade tracking, and student performance oversight.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalStudents || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faculty Count</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalTeachers || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average GPA</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.avgGPA || '3.40'}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dept Attendance</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.deptAttendance || 90}%</h3>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* At-Risk Students */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              At-Risk Students (GPA &lt; 2.5 or Attendance &lt; 75%)
            </h3>
            {stats?.atRiskStudents && stats.atRiskStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Student</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Sem</th>
                      <th className="pb-3 font-semibold">GPA</th>
                      <th className="pb-3 font-semibold text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {stats.atRiskStudents.map((std) => (
                      <tr key={std._id} className="text-slate-300">
                        <td className="py-3 font-medium text-white">{std.name}</td>
                        <td className="py-3">{std.email}</td>
                        <td className="py-3">{std.semester}</td>
                        <td className="py-3 text-rose-400 font-semibold">{std.gpa}</td>
                        <td className="py-3 text-right text-rose-400 font-semibold">{std.attendance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">All students are meeting target GPA & attendance. Outstanding!</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white">Academic Actions</h3>
            <div className="space-y-3">
              <Link
                to="/analytics"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-accent-500" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">View Charts & Reports</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD VIEW ---
  if (user?.role === 'admin') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">System database logs, user profiles manager, and global settings.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalUsers || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Courses</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalCourses || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignments</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalAssignments || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 glow-card-accent flex items-center gap-4">
            <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl">
              <FolderMinus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resources</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalResources || 0}</h3>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Roles Breakdown */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="font-bold text-white">Database Users Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-400">Students</span>
                <span className="text-lg font-bold text-white">{stats?.roles?.student || 0}</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-400">Teachers</span>
                <span className="text-lg font-bold text-white">{stats?.roles?.teacher || 0}</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-400">HODs</span>
                <span className="text-lg font-bold text-white">{stats?.roles?.hod || 0}</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-400">Administrators</span>
                <span className="text-lg font-bold text-white">{stats?.roles?.admin || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white">System Actions</h3>
            <div className="space-y-3">
              <Link
                to="/users"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group animate-pulse-soft"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent-500" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Manage Users</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
              <Link
                to="/notices"
                className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Manage Notices</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
