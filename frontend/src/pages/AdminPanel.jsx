import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Users, BookOpen, FileText, BarChart3, TrendingUp,
  Activity, Award, Clock, ChevronRight, Layers,
  Shield, Database, Zap, Bell, AlertTriangle,
  GraduationCap, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ─── helper ──────────────────────────────────────────────────────────────────
const roleBadge = {
  student: { bg: '#E6F4EA', color: '#10B981', label: 'Student' },
  teacher: { bg: '#EBF5FF', color: '#2563EB', label: 'Teacher' },
  hod:     { bg: '#FFF9E6', color: '#F59E0B', label: 'HOD' },
  admin:   { bg: '#FDF2F2', color: '#EF4444', label: 'Admin' },
};

const chartBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#475569', font: { family: 'Outfit', size: 11, weight: '600' } } },
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      titleColor: '#0F172A',
      bodyColor: '#475569',
      padding: 10,
      cornerRadius: 10,
    }
  },
  scales: {
    x: {
      grid: { color: '#F1F5F9' },
      ticks: { color: '#64748B', font: { family: 'Outfit', size: 10 } }
    },
    y: {
      grid: { color: '#F1F5F9' },
      ticks: { color: '#64748B', font: { family: 'Outfit', size: 10 } }
    }
  }
};

// ─── Component ───────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const load = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await api.get('/analytics/admin');
      if (res.data.success) setStats(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Chart datasets ────────────────────────────────────────────────────────
  const registrationChart = {
    labels: stats?.monthLabels || [],
    datasets: [{
      label: 'New Registrations',
      data: stats?.monthlyReg || [],
      fill: true,
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      borderColor: '#2563EB',
      pointBackgroundColor: '#2563EB',
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.45,
      borderWidth: 2,
    }]
  };

  const submissionChart = {
    labels: stats?.monthLabels || [],
    datasets: [{
      label: 'Submissions',
      data: stats?.submissionTrend || [],
      fill: true,
      backgroundColor: 'rgba(124, 98, 237, 0.08)',
      borderColor: '#7C3AED',
      pointBackgroundColor: '#7C3AED',
      pointRadius: 5,
      tension: 0.45,
      borderWidth: 2,
    }]
  };

  const rolesChart = {
    labels: ['Students', 'Teachers', 'HODs', 'Admins'],
    datasets: [{
      data: [
        stats?.roles?.student || 0,
        stats?.roles?.teacher || 0,
        stats?.roles?.hod || 0,
        stats?.roles?.admin || 0
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.75)',
        'rgba(37, 99, 235, 0.75)',
        'rgba(245, 158, 11, 0.75)',
        'rgba(239, 68, 68, 0.75)'
      ],
      borderColor: ['#10B981','#2563EB','#F59E0B','#EF4444'],
      borderWidth: 2,
      hoverOffset: 10,
    }]
  };

  const topCoursesChart = {
    labels: (stats?.topCourses || []).map(c => c.code || c.name?.slice(0,10) || 'N/A'),
    datasets: [{
      label: 'Enrollments',
      data: (stats?.topCourses || []).map(c => c.count),
      backgroundColor: [
        'rgba(37, 99, 235, 0.75)',
        'rgba(124, 98, 237, 0.75)',
        'rgba(6, 182, 212, 0.75)',
        'rgba(16, 185, 129, 0.75)',
        'rgba(245, 158, 11, 0.75)',
      ],
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const submissionStatusChart = {
    labels: ['Graded', 'Pending', 'Other'],
    datasets: [{
      data: [
        stats?.gradedSubmissions || 0,
        stats?.pendingSubmissions || 0,
        Math.max(0, (stats?.totalSubmissions || 0) - (stats?.gradedSubmissions || 0) - (stats?.pendingSubmissions || 0))
      ],
      backgroundColor: ['rgba(16, 185, 129, 0.80)','rgba(245, 158, 11, 0.80)','rgba(37, 99, 235, 0.20)'],
      borderColor: ['#10B981','#F59E0B','#2563EB'],
      borderWidth: 2,
    }]
  };

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Users',       value: stats?.totalUsers || 0,       icon: Users,      accent: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
    { label: 'Active Courses',    value: stats?.totalCourses || 0,     icon: BookOpen,   accent: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
    { label: 'Total Assignments', value: stats?.totalAssignments || 0, icon: FileText,   accent: '#10B981', bg: 'rgba(16,185,129,0.10)' },
    { label: 'AI Quizzes',        value: stats?.totalQuizzes || 0,     icon: Zap,        accent: '#06B6D4', bg: 'rgba(6,182,212,0.10)' },
    { label: 'Enrollments',       value: stats?.totalEnrollments || 0, icon: GraduationCap, accent: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
    { label: 'Resources',         value: stats?.totalResources || 0,   icon: Database,   accent: '#06B6D4', bg: 'rgba(6,182,212,0.10)' },
    { label: 'Submissions',       value: stats?.totalSubmissions || 0, icon: Layers,     accent: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
    { label: 'Pending Reviews',   value: stats?.pendingSubmissions || 0, icon: Clock,    accent: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  ];

  const tabs = [
    { id: 'overview',  label: 'Overview',      icon: BarChart3 },
    { id: 'users',     label: 'User Activity',  icon: Users },
    { id: 'academic',  label: 'Academics',      icon: Award },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(37,99,235,0.2)', borderTopColor: '#2563EB' }} />
      <p className="text-sm animate-pulse" style={{ color: '#64748B' }}>Loading system analytics...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="p-6 rounded-2xl text-center space-y-4 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #FECACA' }}>
        <AlertTriangle className="w-8 h-8 text-danger mx-auto" />
        <p className="font-semibold" style={{ color: '#0F172A' }}>Failed to load analytics</p>
        <button onClick={load} className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 mx-auto cursor-pointer" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#0F172A' }}>
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            Admin Control Panel
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            Full system overview — users, courses, submissions, AI activity & trends.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#BFDBFE'}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* ── 8 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card-light glow-card-accent p-5 flex items-center gap-4 group cursor-default"
            >
              <div className="p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110" style={{ background: card.bg, color: card.accent }}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: '#64748B' }}>{card.label}</p>
                <h3 className="text-2xl font-black mt-0.5" style={{ color: '#0F172A' }}>{card.value.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={isActive ? {
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(37,99,235,0.15)'
              } : { color: '#64748B' }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: OVERVIEW ───────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Row 1: Registration trend + User roles doughnut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line — Monthly Registrations */}
            <div className="lg:col-span-2 card-light p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  User Registrations — Last 6 Months
                </h3>
                <span className="text-[10px] text-cyan-400 font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.20)' }}>
                  Live
                </span>
              </div>
              <div className="h-60 relative">
                <Line data={registrationChart} options={chartBase} />
              </div>
            </div>

            {/* Doughnut — User Roles */}
            <div className="card-light p-6 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-cyan-400" />
                User Role Distribution
              </h3>
              <div className="h-52 relative">
                <Doughnut data={rolesChart} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#7dd3fc', font: { family: 'Outfit', size: 10 }, padding: 12 } },
                    tooltip: chartBase.plugins.tooltip
                  },
                  cutout: '68%'
                }} />
              </div>
              {/* Role counts below chart */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[
                  { label: 'Students', val: stats?.roles?.student || 0, color: '#34d399' },
                  { label: 'Teachers', val: stats?.roles?.teacher || 0, color: '#22d3ee' },
                  { label: 'HODs',     val: stats?.roles?.hod || 0,     color: '#fbbf24' },
                  { label: 'Admins',   val: stats?.roles?.admin || 0,   color: '#f87171' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                      <span className="text-[10px] text-sky-400">{r.label}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Submission trend + Status doughnut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-light p-6 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-indigo-400" />
                Submission Activity — Last 6 Months
              </h3>
              <div className="h-60 relative">
                <Line data={submissionChart} options={chartBase} />
              </div>
            </div>

            <div className="card-light p-6 space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Submission Status
              </h3>
              <div className="h-52 relative">
                <Doughnut data={submissionStatusChart} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#7dd3fc', font: { family: 'Outfit', size: 10 }, padding: 12 } },
                    tooltip: chartBase.plugins.tooltip
                  },
                  cutout: '68%'
                }} />
              </div>
              <div className="space-y-2 pt-1">
                {[
                  { label: 'Graded',  val: stats?.gradedSubmissions || 0,  color: '#34d399' },
                  { label: 'Pending', val: stats?.pendingSubmissions || 0, color: '#fbbf24' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs text-sky-400">{s.label}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: USER ACTIVITY ──────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Recent Users Table */}
          <div className="card-light p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-cyan-400" />
                Recently Registered Users
              </h3>
              <Link
                to="/users"
                className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.18)' }}
              >
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-sky-600 text-[10px] uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(34,211,238,0.10)' }}>
                    <th className="pb-3 text-left font-bold">Name</th>
                    <th className="pb-3 text-left font-bold">Email</th>
                    <th className="pb-3 text-left font-bold">Role</th>
                    <th className="pb-3 text-left font-bold">Department</th>
                    <th className="pb-3 text-right font-bold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentUsers || []).map((u) => {
                    const rb = roleBadge[u.role] || roleBadge.student;
                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid rgba(34,211,238,0.06)' }}>
                        <td className="py-3 font-semibold text-white">{u.name}</td>
                        <td className="py-3 text-sky-400 text-xs">{u.email}</td>
                        <td className="py-3">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: rb.bg, color: rb.color }}>
                            {rb.label}
                          </span>
                        </td>
                        <td className="py-3 text-sky-500 text-xs">{u.department || u.semester ? `Sem ${u.semester}` : '—'}</td>
                        <td className="py-3 text-sky-600 text-xs text-right">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick User Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { role: 'Students', val: stats?.roles?.student || 0, color: '#34d399', bg: 'rgba(52,211,153,0.10)', icon: GraduationCap },
              { role: 'Teachers', val: stats?.roles?.teacher || 0, color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', icon: BookOpen },
              { role: 'HODs',     val: stats?.roles?.hod || 0,     color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', icon: Award },
              { role: 'Admins',   val: stats?.roles?.admin || 0,   color: '#f87171', bg: 'rgba(239,68,68,0.10)', icon: Shield },
            ].map(r => {
              const RIcon = r.icon;
              return (
                <div key={r.role} className="card-light p-5 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-2xl" style={{ background: r.bg }}>
                    <RIcon className="w-6 h-6" style={{ color: r.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{r.val}</p>
                    <p className="text-xs text-sky-500 font-semibold mt-0.5">{r.role}</p>
                  </div>
                  {/* mini progress bar */}
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(34,211,238,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: stats?.totalUsers ? `${Math.round((r.val / stats.totalUsers) * 100)}%` : '0%',
                      background: r.color
                    }} />
                  </div>
                  <p className="text-[9px] text-sky-700 font-bold">
                    {stats?.totalUsers ? Math.round((r.val / stats.totalUsers) * 100) : 0}% of total
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: ACADEMICS ──────────────────────────────────────────────── */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Top Courses Bar Chart */}
          <div className="card-light p-6 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Top Courses by Enrollment
            </h3>
            <div className="h-64 relative">
              <Bar data={topCoursesChart} options={{
                ...chartBase,
                plugins: {
                  ...chartBase.plugins,
                  legend: { display: false }
                },
                scales: {
                  ...chartBase.scales,
                  y: { ...chartBase.scales.y, beginAtZero: true }
                }
              }} />
            </div>
            {/* course list below chart */}
            <div className="space-y-2 pt-2">
              {(stats?.topCourses || []).map((c, idx) => (
                <div key={c._id} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-sky-700 w-4">#{idx + 1}</span>
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                    <span className="text-[9px] text-sky-600 font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.08)' }}>{c.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full" style={{ background: 'rgba(34,211,238,0.08)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, Math.round(c.count / Math.max(...(stats?.topCourses || []).map(x => x.count), 1) * 100))}%`,
                        background: 'linear-gradient(90deg, #0891b2, #22d3ee)'
                      }} />
                    </div>
                    <span className="text-xs font-bold text-cyan-400">{c.count}</span>
                  </div>
                </div>
              ))}
              {(stats?.topCourses || []).length === 0 && (
                <p className="text-center text-sky-600 text-sm py-4">No enrollment data yet.</p>
              )}
            </div>
          </div>

          {/* Academic summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Assignments', val: stats?.totalAssignments || 0, sub: 'Created across all courses', color: '#34d399', bg: 'rgba(52,211,153,0.10)', icon: FileText },
              { label: 'Graded Submissions', val: stats?.gradedSubmissions || 0, sub: `of ${stats?.totalSubmissions || 0} total`, color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', icon: CheckCircle2 },
              { label: 'Pending Reviews', val: stats?.pendingSubmissions || 0, sub: 'Awaiting teacher grading', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', icon: Clock },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="card-light p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ background: item.bg }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">{item.label}</p>
                      <h3 className="text-3xl font-black text-white">{item.val}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-sky-500">{item.sub}</p>
                  <div className="h-1 w-full rounded-full" style={{ background: 'rgba(34,211,238,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: '100%', background: item.color, opacity: 0.5 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick nav to management pages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Manage Users',   sub: 'Add, edit or remove system accounts', to: '/users',   color: '#22d3ee', icon: Users },
              { label: 'Notice Manager', sub: 'Broadcast notices to all departments', to: '/notices', color: '#818cf8', icon: Bell },
            ].map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="card-light p-5 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ background: `${item.color}18` }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{item.label}</p>
                      <p className="text-xs text-sky-500 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-sky-600 group-hover:text-cyan-400 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
