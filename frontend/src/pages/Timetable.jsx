import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Clock, MapPin, User, BookOpen, Layers, Filter, Grid, List } from 'lucide-react';
import api from '../services/api';

const Timetable = () => {
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'agenda'
  
  // HOD & Admin Filter States
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [teachersList, setTeachersList] = useState([]);

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        setLoading(true);
        // Student fetches their enrolled courses
        // Teacher/Admin/HOD fetches all courses (they teach or admin owns)
        const endpoint = user.role === 'student' ? '/courses/enrolled/me' : '/courses';
        const res = await api.get(endpoint);
        if (res.data.success) {
          setCourses(res.data.data);
        }

        // If HOD or Admin, retrieve teachers to fill in filters
        if (user.role === 'hod' || user.role === 'admin') {
          const teachersRes = await api.get('/users/teachers');
          if (teachersRes.data.success) {
            setTeachersList(teachersRes.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to retrieve timetable database', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetableData();
  }, [user]);

  // Aggregate and format all schedule slots from courses
  const getFilteredSchedules = () => {
    let list = [];
    courses.forEach(course => {
      // Apply Admin/HOD filters
      if (user.role === 'hod' || user.role === 'admin') {
        if (selectedSemester !== 'All' && course.semester.toString() !== selectedSemester) {
          return;
        }
        if (selectedTeacher !== 'All' && course.teacher?._id !== selectedTeacher) {
          return;
        }
      }

      if (course.schedule && course.schedule.length > 0) {
        course.schedule.forEach(slot => {
          list.push({
            _id: `${course._id}-${slot._id}-${slot.day}`,
            courseId: course._id,
            courseName: course.name,
            courseCode: course.code,
            category: course.category,
            semester: course.semester,
            teacherName: course.teacher?.name || 'Faculty',
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room
          });
        });
      }
    });

    // Sort chronologically by start time helper
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours);
      minutes = parseInt(minutes);
      if (hours === 12 && modifier === 'AM') hours = 0;
      if (modifier === 'PM' && hours < 12) hours += 12;
      return hours * 60 + minutes;
    };

    return list.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const allSchedules = getFilteredSchedules();

  // Helper to color code courses
  const getCourseColorClass = (code) => {
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'border-blue-500/30 bg-blue-500/5 text-blue-400',
      'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
      'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
      'border-rose-500/30 bg-rose-500/5 text-rose-400',
      'border-amber-500/30 bg-amber-500/5 text-amber-400',
      'border-purple-500/30 bg-purple-500/5 text-purple-400'
    ];
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Academic Timetable</h1>
          <p className="text-sm text-slate-400">
            {user.role === 'student'
              ? 'Weekly lecture slots and room coordinates for your enrolled classes.'
              : 'Class distribution timeline and faculty availability tracker.'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl self-start">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-accent-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Weekly Grid</span>
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-accent-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Daily Agenda</span>
          </button>
        </div>
      </div>

      {/* Administrative Filters */}
      {(user.role === 'hod' || user.role === 'admin') && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4 bg-slate-900/35">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-accent-500" />
            <span>Timetable Filter Options:</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
            >
              <option value="All">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem.toString()}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Teacher:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white w-48"
            >
              <option value="All">All Teachers</option>
              {teachersList.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* WEEKLY GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px] grid grid-cols-7 gap-4">
            {daysOfWeek.map((day) => {
              const daySchedules = allSchedules.filter((s) => s.day === day);
              return (
                <div key={day} className="space-y-4">
                  {/* Day Header Banner */}
                  <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl text-center">
                    <h3 className="font-bold text-sm text-white">{day}</h3>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      {daySchedules.length} {daySchedules.length === 1 ? 'Class' : 'Classes'}
                    </span>
                  </div>

                  {/* Day Class Slots */}
                  <div className="space-y-3 min-h-[400px] rounded-2xl bg-slate-950/25 border border-dashed border-slate-800/40 p-2">
                    {daySchedules.length > 0 ? (
                      daySchedules.map((slot) => (
                        <div
                          key={slot._id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all hover:scale-[1.02] hover:-translate-y-0.5 ${getCourseColorClass(
                            slot.courseCode
                          )}`}
                        >
                          <div>
                            <span className="text-[8px] font-extrabold uppercase tracking-wider bg-slate-950/40 px-1.5 py-0.5 rounded border border-white/5">
                              Sem {slot.semester}
                            </span>
                            <h4 className="font-bold text-xs text-white leading-snug mt-1.5 line-clamp-2">
                              {slot.courseName}
                            </h4>
                            <p className="text-[9px] opacity-75 font-semibold mt-0.5">{slot.courseCode}</p>
                          </div>

                          <div className="space-y-1.5 border-t border-white/5 pt-2">
                            <p className="text-[10px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              <span>{slot.startTime}</span>
                            </p>
                            <p className="text-[9px] flex items-center gap-1 font-semibold uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              <span>{slot.room}</span>
                            </p>
                            <p className="text-[9px] flex items-center gap-1 opacity-80">
                              <User className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              <span className="truncate">{slot.teacherName}</span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center py-12 text-slate-600 text-[10px] font-semibold uppercase tracking-wider select-none text-center">
                        Free Day
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAILY AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="space-y-6 max-w-3xl">
          {daysOfWeek.map((day) => {
            const daySchedules = allSchedules.filter((s) => s.day === day);
            if (daySchedules.length === 0) return null;

            return (
              <div key={day} className="space-y-3">
                <h3 className="font-bold text-slate-350 text-sm border-l-2 border-accent-500 pl-2.5 uppercase tracking-wider">
                  {day}
                </h3>
                <div className="space-y-3">
                  {daySchedules.map((slot) => (
                    <div
                      key={slot._id}
                      className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Semester {slot.semester}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-500/10 text-accent-400">
                              {slot.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base mt-2">{slot.courseName}</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Course Code: <span className="font-semibold text-accent-400">{slot.courseCode}</span> | Instructor: <span className="text-slate-300">{slot.teacherName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0 shrink-0">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-accent-500" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{slot.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {allSchedules.length === 0 && (
            <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base">No Timetable Entries</h3>
              <p className="text-sm text-slate-500 mt-1">
                There are no scheduled lectures mapped for this query or enrollment list.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timetable;
