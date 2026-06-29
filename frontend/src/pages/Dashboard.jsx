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
  Plus,
  Bell,
  BarChart3
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setApiError(false);
      const endpoint = `/analytics/${user.role}`;
      const response = await api.get(endpoint);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setApiError(true); // Show retry UI instead of infinite spinner
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      fetchDashboardStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'rgba(37,99,235,0.2)', borderTopColor:'#2563EB'}}></div>
        <p className="text-sm animate-pulse" style={{color:'#64748B'}}>Connecting to database...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-2xl text-center max-w-sm" style={{background:'#FFFFFF',border:'1px solid #FECACA'}}>
          <p className="font-semibold mb-1" style={{color:'#1E293B'}}>Connection Timeout</p>
          <p className="text-xs mb-4" style={{color:'#64748B'}}>Database is taking longer than usual. Please retry.</p>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
            style={{background:'linear-gradient(135deg,#2563EB,#3B82F6)'}}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // --- STUDENT DASHBOARD VIEW ---
  if (user?.role === 'student') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold" style={{color:'#1E293B'}}>Student Dashboard</h1>
          <p className="text-sm" style={{color:'#64748B'}}>Track your courses, attendance, GPA, and upcoming due dates.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-light glow-card-accent flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl" style={{background:'#EFF6FF',color:'#2563EB'}}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>Courses</p>
              <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{stats?.totalCourses || 0}</h3>
            </div>
          </div>

          <div className="card-light glow-card-accent flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl" style={{background:'#F0FDF4',color:'#22C55E'}}>
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>Attendance</p>
              <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{stats?.attendanceRate || 85}%</h3>
            </div>
          </div>

          <div className="card-light glow-card-accent flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl" style={{background:'#EFF6FF',color:'#3B82F6'}}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>Target GPA</p>
              <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{stats?.gpa || '3.50'}</h3>
            </div>
          </div>

          <div className="card-light glow-card-accent flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl" style={{background:'#FFFBEB',color:'#F59E0B'}}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>Submissions</p>
              <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{stats?.completedSubmissions || 0}</h3>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Assignments */}
          <div className="lg:col-span-2 card-light p-6 space-y-4">
            <div className="flex items-center justify-between pb-3" style={{borderBottom:'1px solid #E2E8F0'}}>
              <h3 className="font-bold flex items-center gap-2" style={{color:'#1E293B'}}>
                <Clock className="w-5 h-5" style={{color:'#2563EB'}} />
                Upcoming Deadlines
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{background:'#EFF6FF',border:'1px solid #BFDBFE',color:'#2563EB'}}>
                Pending Actions
              </span>
            </div>
            {stats?.upcomingAssignments && stats.upcomingAssignments.length > 0 ? (
              <div>
                {stats.upcomingAssignments.map((assign) => (
                  <div key={assign._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4" style={{borderBottom:'1px solid #F1F5F9'}}>
                    <div>
                      <h4 className="font-semibold text-sm" style={{color:'#1E293B'}}>{assign.title}</h4>
                      <p className="text-xs mt-1" style={{color:'#94A3B8'}}>{assign.course?.name} ({assign.course?.code})</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[11px] px-3 py-1 rounded-lg font-medium" style={{background:'#FEF2F2',border:'1px solid #FECACA',color:'#EF4444'}}>
                        Due: {new Date(assign.dueDate).toLocaleDateString()}
                      </span>
                      <Link to={`/courses/${assign.course?._id}`} className="transition-all" style={{color:'#94A3B8'}}>
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-6" style={{color:'#94A3B8'}}>No upcoming assignments due. Great job!</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="card-light p-6 space-y-6">
            <h3 className="font-bold" style={{color:'#1E293B'}}>AI Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/courses"
                className="flex items-center justify-between p-4 rounded-xl transition-all group"
                style={{background:'#EFF6FF',border:'1px solid #BFDBFE'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#2563EB'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#BFDBFE'}
              >
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5" style={{color:'#2563EB'}} />
                  <span className="text-sm font-semibold" style={{color:'#2563EB'}}>View Courses</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{color:'#93C5FD'}} />
              </Link>
              <Link
                to="/resources"
                className="flex items-center justify-between p-4 rounded-xl transition-all group"
                style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#22C55E'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#BBF7D0'}
              >
                <div className="flex items-center gap-3">
                  <FolderMinus className="w-5 h-5" style={{color:'#22C55E'}} />
                  <span className="text-sm font-semibold" style={{color:'#16A34A'}}>AI Datasets & Papers</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{color:'#86EFAC'}} />
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
          <h1 className="text-2xl font-bold" style={{color:'#1E293B'}}>Teacher Dashboard</h1>
          <p className="text-sm" style={{color:'#64748B'}}>Coordinate courses, mark classroom roll counts, and review submissions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label:'Active Courses', val:stats?.totalCourses||0, icon:BookOpen, bg:'#EFF6FF', color:'#2563EB' },
            { label:'Students Enrolled', val:stats?.totalStudents||0, icon:Users, bg:'#F5F3FF', color:'#7C3AED' },
            { label:'Assignments Created', val:stats?.totalAssignments||0, icon:FileText, bg:'#F0FDF4', color:'#22C55E' },
            { label:'Pending Grading', val:stats?.pendingSubmissions||0, icon:AlertTriangle, bg:'#FFFBEB', color:'#F59E0B' },
          ].map(card => { const I=card.icon; return (
            <div key={card.label} className="card-light glow-card-accent flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl" style={{background:card.bg,color:card.color}}><I className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>{card.label}</p>
                <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{card.val}</h3>
              </div>
            </div>
          );})}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card-light p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2" style={{color:'#1E293B'}}>
              <AlertTriangle className="w-5 h-5" style={{color:'#F59E0B'}} />
              Submissions Requiring Grading
            </h3>
            {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider" style={{color:'#94A3B8',borderBottom:'1px solid #E2E8F0'}}>
                      <th className="pb-3 font-semibold">Student</th>
                      <th className="pb-3 font-semibold">Assignment</th>
                      <th className="pb-3 font-semibold">Submitted</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions.map((sub) => (
                      <tr key={sub._id} style={{borderBottom:'1px solid #F1F5F9'}}>
                        <td className="py-3 font-medium" style={{color:'#1E293B'}}>{sub.student?.name}</td>
                        <td className="py-3" style={{color:'#64748B'}}>{sub.assignment?.title}</td>
                        <td className="py-3" style={{color:'#94A3B8'}}>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/courses/${sub.assignment?.course}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                            style={{background:'#EFF6FF',border:'1px solid #BFDBFE',color:'#2563EB'}}
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
              <p className="text-sm text-center py-6" style={{color:'#94A3B8'}}>All submissions are graded! Great work.</p>
            )}
          </div>
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold" style={{color:'#1E293B'}}>Course Controls</h3>
            <div className="space-y-3">
              {[
                { to:'/courses', label:'Manage My Courses', icon:BookOpen, bg:'#EFF6FF', border:'#BFDBFE', color:'#2563EB' },
                { to:'/notices', label:'Post Notice Board', icon:Bell, bg:'#F5F3FF', border:'#DDD6FE', color:'#7C3AED' },
              ].map(item => { const I=item.icon; return (
                <Link key={item.to} to={item.to}
                  className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{background:item.bg,border:`1px solid ${item.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(37,99,235,0.10)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
                >
                  <div className="flex items-center gap-3">
                    <I className="w-5 h-5" style={{color:item.color}} />
                    <span className="text-sm font-semibold" style={{color:item.color}}>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{color:item.color}} />
                </Link>
              );})}
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
          <h1 className="text-2xl font-bold" style={{color:'#1E293B'}}>HOD Dashboard</h1>
          <p className="text-sm" style={{color:'#64748B'}}>Department metrics, grade tracking, and student performance oversight.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label:'Total Students', val:stats?.totalStudents||0, icon:Users, bg:'#EFF6FF', color:'#2563EB' },
            { label:'Faculty Count', val:stats?.totalTeachers||0, icon:GraduationCap, bg:'#F5F3FF', color:'#7C3AED' },
            { label:'Average GPA', val:stats?.avgGPA||'3.40', icon:TrendingUp, bg:'#F0FDF4', color:'#22C55E' },
            { label:'Dept Attendance', val:`${stats?.deptAttendance||90}%`, icon:Percent, bg:'#FFFBEB', color:'#F59E0B' },
          ].map(card => { const I=card.icon; return (
            <div key={card.label} className="card-light glow-card-accent flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl" style={{background:card.bg,color:card.color}}><I className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>{card.label}</p>
                <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{card.val}</h3>
              </div>
            </div>
          );})}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card-light p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2" style={{color:'#1E293B'}}>
              <AlertTriangle className="w-5 h-5" style={{color:'#EF4444'}} />
              At-Risk Students (GPA &lt; 2.5 or Attendance &lt; 75%)
            </h3>
            {stats?.atRiskStudents && stats.atRiskStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider" style={{color:'#94A3B8',borderBottom:'1px solid #E2E8F0'}}>
                      <th className="pb-3 font-semibold">Student</th><th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Sem</th><th className="pb-3 font-semibold">GPA</th>
                      <th className="pb-3 font-semibold text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.atRiskStudents.map((std) => (
                      <tr key={std._id} style={{borderBottom:'1px solid #F1F5F9'}}>
                        <td className="py-3 font-medium" style={{color:'#1E293B'}}>{std.name}</td>
                        <td className="py-3" style={{color:'#64748B'}}>{std.email}</td>
                        <td className="py-3" style={{color:'#64748B'}}>{std.semester}</td>
                        <td className="py-3 font-semibold" style={{color:'#EF4444'}}>{std.gpa}</td>
                        <td className="py-3 text-right font-semibold" style={{color:'#EF4444'}}>{std.attendance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-center py-6" style={{color:'#94A3B8'}}>All students are meeting target GPA & attendance. Outstanding!</p>
            )}
          </div>
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold" style={{color:'#1E293B'}}>Academic Actions</h3>
            <div className="space-y-3">
              <Link to="/analytics"
                className="flex items-center justify-between p-4 rounded-xl transition-all"
                style={{background:'#EFF6FF',border:'1px solid #BFDBFE'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#2563EB'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#BFDBFE'}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5" style={{color:'#2563EB'}} />
                  <span className="text-sm font-semibold" style={{color:'#2563EB'}}>View Charts & Reports</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{color:'#93C5FD'}} />
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
          <h1 className="text-2xl font-bold" style={{color:'#1E293B'}}>Admin Dashboard</h1>
          <p className="text-sm" style={{color:'#64748B'}}>System database logs, user profiles manager, and global settings.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label:'Total Users', val:stats?.totalUsers||0, icon:Users, bg:'#EFF6FF', color:'#2563EB' },
            { label:'Total Courses', val:stats?.totalCourses||0, icon:BookOpen, bg:'#F5F3FF', color:'#7C3AED' },
            { label:'Assignments', val:stats?.totalAssignments||0, icon:FileText, bg:'#F0FDF4', color:'#22C55E' },
            { label:'Resources', val:stats?.totalResources||0, icon:FolderMinus, bg:'#FFFBEB', color:'#F59E0B' },
          ].map(card => { const I=card.icon; return (
            <div key={card.label} className="card-light glow-card-accent flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl" style={{background:card.bg,color:card.color}}><I className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#94A3B8'}}>{card.label}</p>
                <h3 className="text-2xl font-bold mt-1" style={{color:'#1E293B'}}>{card.val}</h3>
              </div>
            </div>
          );})}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card-light p-6 space-y-6">
            <h3 className="font-bold" style={{color:'#1E293B'}}>Database Users Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label:'Students', val:stats?.roles?.student||0, bg:'#EFF6FF', border:'#BFDBFE', color:'#2563EB' },
                { label:'Teachers', val:stats?.roles?.teacher||0, bg:'#F5F3FF', border:'#DDD6FE', color:'#7C3AED' },
                { label:'HODs', val:stats?.roles?.hod||0, bg:'#F0FDF4', border:'#BBF7D0', color:'#22C55E' },
                { label:'Administrators', val:stats?.roles?.admin||0, bg:'#FEF2F2', border:'#FECACA', color:'#EF4444' },
              ].map(r => (
                <div key={r.label} className="p-4 rounded-xl flex items-center justify-between" style={{background:r.bg,border:`1px solid ${r.border}`}}>
                  <span className="text-sm font-semibold" style={{color:r.color}}>{r.label}</span>
                  <span className="text-lg font-bold" style={{color:'#1E293B'}}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold" style={{color:'#1E293B'}}>System Actions</h3>
            <div className="space-y-3">
              {[
                { to:'/users', label:'Manage Users', icon:Users, bg:'#EFF6FF', border:'#BFDBFE', color:'#2563EB' },
                { to:'/notices', label:'Manage Notices', icon:Bell, bg:'#F5F3FF', border:'#DDD6FE', color:'#7C3AED' },
              ].map(item => { const I=item.icon; return (
                <Link key={item.to} to={item.to}
                  className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{background:item.bg,border:`1px solid ${item.border}`}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(37,99,235,0.10)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
                >
                  <div className="flex items-center gap-3">
                    <I className="w-5 h-5" style={{color:item.color}} />
                    <span className="text-sm font-semibold" style={{color:item.color}}>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{color:item.color}} />
                </Link>
              );})}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
