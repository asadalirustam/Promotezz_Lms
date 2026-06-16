import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { BarChart3, TrendingUp, Users, Award, Percent } from 'lucide-react';

// Register ChartJS modules to avoid rendering scales crashes
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/hod');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load HOD analytics metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- CHART 1: GRADE DISTRIBUTION ---
  const gradeData = {
    labels: ['GPA 3.5 - 4.0', 'GPA 3.0 - 3.49', 'GPA 2.5 - 2.99', 'GPA < 2.5 (At Risk)'],
    datasets: [
      {
        label: 'Student Counts',
        data: [42, 28, 15, stats?.atRiskStudents?.length || 2],
        backgroundColor: [
          'rgba(14, 165, 233, 0.75)',  // Cyan/Accent
          'rgba(99, 102, 241, 0.75)',  // Indigo
          'rgba(168, 85, 247, 0.75)',  // Purple
          'rgba(244, 63, 94, 0.75)'     // Rose
        ],
        borderColor: [
          '#0ea5e9',
          '#6366f1',
          '#a855f7',
          '#f43f5e'
        ],
        borderWidth: 1.5
      }
    ]
  };

  // --- CHART 2: COURSE ATTENDANCE COMPARISON ---
  const attendanceComparisonData = {
    labels: ['Machine Learning', 'NLP', 'Deep Learning', 'Computer Vision', 'Generative AI'],
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: [92, 88, 95, 84, 91],
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        borderColor: '#0ea5e9',
        borderWidth: 2,
        tension: 0.35,
        fill: true
      }
    ]
  };

  // --- CHART 3: PERFORMANCE AVERAGE (QUIZZES VS ASSIGNMENTS) ---
  const performanceData = {
    labels: ['Machine Learning', 'NLP', 'Deep Learning', 'Computer Vision', 'Generative AI'],
    datasets: [
      {
        label: 'Avg Quiz Grade (%)',
        data: [82, 76, 88, 71, 85],
        backgroundColor: 'rgba(99, 102, 241, 0.85)', // Indigo
        borderRadius: 8
      },
      {
        label: 'Avg Assignment Grade (%)',
        data: [85, 79, 91, 74, 89],
        backgroundColor: 'rgba(14, 165, 233, 0.85)', // Cyan
        borderRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit', weight: 'bold' }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-accent-500" />
          Academic Analytics & Metrics
        </h1>
        <p className="text-sm text-slate-400">Department performance indicators, GPAs distribution profiles, and attendance curves.</p>
      </div>

      {/* Overview Statistics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrollment</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats?.totalStudents || 0} Students</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Department GPA</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats?.avgGPA || '3.40'} / 4.00</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Attendance</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats?.deptAttendance || 92}%</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-600/10 text-rose-400 rounded-xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active AI Courses</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats?.totalCourses || 0} Courses</h3>
          </div>
        </div>
      </div>

      {/* Charts Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance averages bar chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">Assessment Metrics per Course</h3>
          <div className="h-80 relative">
            <Bar data={performanceData} options={options} />
          </div>
        </div>

        {/* GPA Ranges doughnut */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">Department GPA Distribution</h3>
          <div className="h-80 relative flex items-center justify-center">
            <Doughnut
              data={gradeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Attendance curve line graph */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Average Attendance Curve per Course Module</h3>
        <div className="h-72 relative">
          <Line data={attendanceComparisonData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
