import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, User, Calendar, Award, Tag, Plus, X, GraduationCap } from 'lucide-react';

const Courses = () => {
  const { user } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // All courses for student enrollment
  const [loading, setLoading] = useState(true);
  
  // Create Course Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [teachers, setTeachers] = useState([]); // For Admin to pick a teacher
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    description: '',
    creditHours: 3,
    semester: 5,
    teacher: user?.role === 'teacher' ? user._id : '',
    category: 'Core',
    schedule: []
  });
  const [tempSchedule, setTempSchedule] = useState({ day: 'Monday', startTime: '09:00 AM', endTime: '10:35 AM', room: 'Room 201' });
  const [submitError, setSubmitError] = useState('');

  const fetchCoursesData = async () => {
    try {
      setLoading(true);
      // Fetch user specific courses (Students see enrolled, Teachers see their own)
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      }

      // If student, also fetch ALL courses to show what's available for self-enrollment
      if (user?.role === 'student') {
        const allRes = await api.get('/courses'); // For demo, we get all and filter active
        // Filter out courses student is already enrolled in
        const enrolledIds = res.data.data.map(c => c._id);
        const available = allRes.data.data.filter(c => !enrolledIds.includes(c._id));
        setAllCourses(available);
      }

      // If admin, fetch teachers list to populate selection dropdown
      if (user?.role === 'admin') {
        const teachersRes = await api.get('/users/teachers');
        if (teachersRes.data.success) {
          setTeachers(teachersRes.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesData();
  }, [user]);

  const handleEnroll = async (courseId) => {
    try {
      const res = await api.post(`/courses/${courseId}/enroll`);
      if (res.data.success) {
        alert('Enrolled successfully!');
        fetchCoursesData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Form validation
    if (!newCourse.name || !newCourse.code || !newCourse.teacher) {
      setSubmitError('Please fill in name, code and teacher fields');
      return;
    }

    try {
      const res = await api.post('/courses', newCourse);
      if (res.data.success) {
        setShowModal(false);
        // Reset form
        setNewCourse({
          name: '',
          code: '',
          description: '',
          creditHours: 3,
          semester: 5,
          teacher: user?.role === 'teacher' ? user._id : '',
          category: 'Core',
          schedule: []
        });
        fetchCoursesData();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create course');
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Catalog</h1>
          <p className="text-sm text-slate-400">
            {user?.role === 'student' ? 'Access your enrolled lectures and electives.' : 'Coordinate and design syllabus modules.'}
          </p>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        )}
      </div>

      {/* Enrolled / Assigned Courses */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent-500" />
          {user?.role === 'student' ? 'My Enrolled Courses' : 'My Courses'}
        </h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all glow-card-accent">
                <div className="space-y-4">
                  {/* Category & Semester Tag */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-500/10 text-accent-400 border border-accent-500/20">
                      {course.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Semester {course.semester}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-bold text-lg text-white leading-snug">{course.name}</h3>
                    <p className="text-xs text-accent-400 font-semibold mt-1">{course.code}</p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2">{course.description || 'No description provided.'}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] text-slate-400 font-bold flex items-center justify-center">
                      {course.teacher?.name ? course.teacher.name.charAt(0) : 'T'}
                    </div>
                    <span className="text-[11px] text-slate-400">{course.teacher?.name || 'Faculty'}</span>
                  </div>
                  <Link
                    to={`/courses/${course._id}`}
                    className="text-xs font-semibold text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-all"
                  >
                    <span>Enter Portal</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4">No enrolled courses. {user?.role === 'student' && 'Look at available electives below!'}</p>
        )}
      </div>

      {/* Available Electives for Students */}
      {user?.role === 'student' && allCourses.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800/40">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Electives / Available for Enrollment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allCourses.map((course) => (
              <div key={course._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {course.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Semester {course.semester}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{course.name}</h3>
                    <p className="text-xs text-indigo-400 font-semibold mt-1">{course.code}</p>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Credits: <span className="font-bold text-white">{course.creditHours}</span>
                  </div>
                  <button
                    onClick={() => handleEnroll(course._id)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Enroll Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create Academic Course</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              {submitError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 rounded-lg text-xs">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Course Name</label>
                  <input
                    type="text"
                    required
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none"
                    placeholder="e.g. Generative AI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Course Code</label>
                  <input
                    type="text"
                    required
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none"
                    placeholder="e.g. AI-401"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none h-20"
                  placeholder="Explain syllabus outlines, target topics..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Credit Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCourse.creditHours}
                    onChange={(e) => setNewCourse({ ...newCourse, creditHours: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse({ ...newCourse, semester: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Category</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>
              </div>

              {/* Configure Timetable Schedule Dynamic Array */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure Timetable Schedule</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">Day</label>
                    <select
                      value={tempSchedule.day}
                      onChange={(e) => setTempSchedule({ ...tempSchedule, day: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">Room/Location</label>
                    <input
                      type="text"
                      value={tempSchedule.room}
                      onChange={(e) => setTempSchedule({ ...tempSchedule, room: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                      placeholder="e.g. Room 201"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">Start Time</label>
                    <input
                      type="text"
                      value={tempSchedule.startTime}
                      onChange={(e) => setTempSchedule({ ...tempSchedule, startTime: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                      placeholder="e.g. 09:00 AM"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">End Time</label>
                    <input
                      type="text"
                      value={tempSchedule.endTime}
                      onChange={(e) => setTempSchedule({ ...tempSchedule, endTime: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                      placeholder="e.g. 10:30 AM"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-500">
                    Active Entries: {newCourse.schedule.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!tempSchedule.room.trim()) return;
                      setNewCourse({
                        ...newCourse,
                        schedule: [...newCourse.schedule, { ...tempSchedule }]
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-accent-400 font-semibold text-[10px] uppercase rounded-lg hover:bg-slate-850 cursor-pointer"
                  >
                    + Add Day Schedule
                  </button>
                </div>

                {newCourse.schedule.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                    {newCourse.schedule.map((sch, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {sch.day} ({sch.startTime}-{sch.endTime}) @ {sch.room}
                        <button
                          type="button"
                          onClick={() => {
                            setNewCourse({
                              ...newCourse,
                              schedule: newCourse.schedule.filter((_, idx) => idx !== i)
                            });
                          }}
                          className="text-rose-400 hover:text-rose-300 font-bold shrink-0 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {user?.role === 'admin' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Assign Teacher</label>
                  <select
                    required
                    value={newCourse.teacher}
                    onChange={(e) => setNewCourse({ ...newCourse, teacher: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:border-accent-500 outline-none"
                  >
                    <option value="">Select a Teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden"></div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
