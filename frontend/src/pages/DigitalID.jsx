import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Contact, Shield, QrCode, Scan, Calendar, Award, BookOpen, User } from 'lucide-react';

const DigitalID = () => {
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [scanResultMsg, setScanResultMsg] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamification, setGamification] = useState({ xp: 0, level: 1, streak: { current: 0 } });
  
  // Simulation input
  const [simulationStudentId, setSimulationStudentId] = useState('');
  const [studentsList, setStudentsList] = useState([]);

  useEffect(() => {
    // Load student's courses or teacher's courses
    const loadCoursesAndUser = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.data);
        if (res.data.data.length > 0) setSelectedCourse(res.data.data[0]._id);

        if (user?.role === 'student') {
          // Fetch gamification profile
          const gamifyRes = await api.get('/gamification/profile');
          setGamification(gamifyRes.data.data);

          // Generate Student ID QR code data
          const payload = JSON.stringify({
            studentId: user._id,
            name: user.name,
            department: user.department,
            semester: user.semester
          });
          setQrCodeData(`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload)}`);
        } else {
          // Teacher/HOD/Admin: Load student users list for attendance scanner simulation
          const usersRes = await api.get('/users');
          const list = usersRes.data.data.filter(u => u.role === 'student');
          setStudentsList(list);
          if (list.length > 0) setSimulationStudentId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load courses or gamification data', err);
      }
    };
    loadCoursesAndUser();
  }, [user]);

  // Simulate Attendance QR mark check-in (for teachers/HODs)
  const handleMarkQRAttendance = async (e) => {
    e.preventDefault();
    if (!simulationStudentId || !selectedCourse) {
      alert('Please select a student and course to mark attendance.');
      return;
    }

    try {
      setLoading(true);
      setScanResultMsg('');
      const res = await api.post('/attendance-qr/scan', {
        studentId: simulationStudentId,
        courseId: selectedCourse
      });

      if (res.data.success) {
        setScanResultMsg(`Success: ${res.data.message}`);
      }
    } catch (err) {
      setScanResultMsg(`Error: ${err.response?.data?.message || 'Verification failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Contact className="w-3.5 h-3.5" />
            NFC Digital ID Pass
          </span>
          <h1 className="text-3xl font-extrabold text-text-base leading-tight">Digital ID & QR Attendance</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Students can present their virtual identity card to mark attendance. Teachers and HODs can scan or simulate QR passes to automate roll-calls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Render Student Digital ID Card (Only for Students) */}
        {user?.role === 'student' ? (
          <div className="space-y-6">
            <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
              <Contact className="w-4 h-4 text-primary" />
              Your Digital Student ID Card
            </h3>

            {/* Virtual Card */}
            <div className="relative w-full max-w-md h-64 rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white p-6 shadow-xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
              {/* Background styling elements */}
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute left-1/3 top-10 w-24 h-24 bg-blue-400/20 rounded-full blur-xl"></div>
              
              <div className="h-full flex flex-col justify-between relative z-10">
                {/* Header branding */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-sm tracking-wide">UNIVERSITY OF ARTIFICIAL INTELLIGENCE</h4>
                    <p className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">Department of AI & Data Science</p>
                  </div>
                  <Shield className="w-6 h-6 text-white/80" />
                </div>

                {/* Body metadata */}
                <div className="flex items-center gap-6 mt-4">
                  {/* Photo / Avatar */}
                  <div className="w-20 h-20 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-inner">
                    {user.name.charAt(0)}
                  </div>
                  {/* Info details */}
                  <div className="space-y-1 text-left min-w-0">
                    <p className="font-bold text-base truncate leading-snug">{user.name}</p>
                    <p className="text-[10px] text-blue-105 font-bold tracking-wide">{user.email}</p>
                    <p className="text-[10px] text-blue-105 font-semibold mt-1 uppercase">Roll Number: {user._id.slice(-6).toUpperCase()}</p>
                    <p className="text-[9px] text-blue-200 font-semibold uppercase">Sem: {user.semester || 1} &bull; Dept: {user.department || 'AI'}</p>
                  </div>
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between border-t border-white/20 pt-3 text-[9px] font-bold uppercase tracking-wider text-blue-150">
                  <div className="flex items-center gap-3">
                    <span>Level {gamification.level || 1}</span>
                    <span>&bull;</span>
                    <span>XP: {gamification.xp || 0}</span>
                  </div>
                  <span className="text-emerald-350">ACTIVE MEMBER</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-light p-6 text-center text-slate-500 py-12 flex flex-col items-center justify-center gap-3">
            <User className="w-10 h-10 text-primary" />
            <h4 className="font-bold text-text-base text-sm">Faculty Member View</h4>
            <p className="text-xs max-w-sm">You are logged in as a faculty member. Digital Student ID cards are only generated for active department students.</p>
          </div>
        )}

        {/* QR Code and Attendance Simulator Panel */}
        <div className="space-y-6">
          {user?.role === 'student' ? (
            <div className="card-light p-6 space-y-6 flex flex-col items-center justify-center text-center">
              <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary" />
                Mark Attendance QR Code
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">Present this QR code to your class teacher to instantly mark presence for today's session.</p>
              
              {qrCodeData ? (
                <div className="p-4 bg-white border border-border-base rounded-2xl shadow-inner animate-scale">
                  <img src={qrCodeData} alt="Student ID QR Pass" className="w-40 h-40" />
                </div>
              ) : (
                <div className="w-40 h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
              )}

              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Refreshes every class session
              </div>
            </div>
          ) : (
            /* QR Scanning Simulation Panel for Teachers */
            <div className="card-light p-6 space-y-6">
              <h3 className="font-bold text-text-base text-sm uppercase tracking-wider flex items-center gap-2">
                <Scan className="w-4 h-4 text-primary" />
                QR Code Scanner Simulator
              </h3>
              <p className="text-xs text-slate-500">Simulate reading a student ID QR pass to register attendance.</p>
              
              {scanResultMsg && (
                <div className={`p-4 rounded-xl text-xs font-semibold ${scanResultMsg.includes('Success') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
                  {scanResultMsg}
                </div>
              )}

              <form onSubmit={handleMarkQRAttendance} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Target Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base font-semibold"
                  >
                    <option value="" disabled>Select a course</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide">Select Student to Scan</label>
                  <select
                    value={simulationStudentId}
                    onChange={(e) => setSimulationStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base font-semibold"
                  >
                    <option value="" disabled>Select a student ID</option>
                    {studentsList.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10"
                >
                  <Scan className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Simulate Scan / Check-In'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalID;
