import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  BookOpen,
  FileText,
  HelpCircle,
  CheckSquare,
  Plus,
  Download,
  Upload,
  Calendar,
  Award,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Clock,
  MapPin,
  Eye,
  X
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState(true);

  // Data collections
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentRoster, setStudentRoster] = useState([]);

  // Modals & Action forms states
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', description: '', type: 'PDF', externalUrl: '' });
  const [resourceFile, setResourceFile] = useState(null);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', maxPoints: 50 });
  const [assignmentFile, setAssignmentFile] = useState(null);

  // Student Submissions tracking
  const [submissionFiles, setSubmissionFiles] = useState({}); // { [assignmentId]: File }
  const [mySubmissions, setMySubmissions] = useState({}); // { [assignmentId]: SubmissionDoc }

  // Teacher Gradebook tracking
  const [selectedAssignment, setSelectedAssignment] = useState(null); // Assignment object selected for grading
  const [submissionsList, setSubmissionsList] = useState([]); // Student submissions for that assignment
  const [gradesData, setGradesData] = useState({}); // { [submissionId]: { grade: Number, feedback: String } }

  // Teacher Quiz Builder states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    duration: 10,
    passingMarks: 2,
    questions: [
      { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]
  });

  // Student Attendance Summary
  const [myAttendance, setMyAttendance] = useState(null);

  // Teacher Attendance Tracker states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { [studentId]: 'present'|'absent'|'late' }

  // Timetable Schedule states
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [courseScheduleList, setCourseScheduleList] = useState([]);
  const [editTempSchedule, setEditTempSchedule] = useState({ day: 'Monday', startTime: '09:00 AM', endTime: '10:30 AM', room: 'Room 201' });

  // Exam Papers states
  const [examPapers, setExamPapers] = useState([]);
  const [viewingPaper, setViewingPaper] = useState(null); // Paper object being viewed by student

  // Sessional & Gradebook states
  const [gradebookList, setGradebookList] = useState([]);
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [editGrades, setEditGrades] = useState({
    midtermMarks: 0,
    finalMarks: 0,
    sessionalMarks: 0,
    assignmentMarks: 0,
    quizMarks: 0,
    grade: '',
    status: 'active'
  });

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${id}`);
      if (res.data.success) {
        setCourse(res.data.data);
        setCourseScheduleList(res.data.data.schedule || []);
      }

      // Load specific tab data
      await loadTabContent(activeTab);
    } catch (err) {
      console.error('Failed to load course details', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = async (tab) => {
    try {
      if (tab === 'resources') {
        const res = await api.get(`/resources/course/${id}`);
        setResources(res.data.data);
      } else if (tab === 'assignments') {
        const res = await api.get(`/assignments/course/${id}`);
        setAssignments(res.data.data);
        
        if (user?.role === 'student') {
          // Fetch student's own submissions for these assignments
          const subPromises = res.data.data.map(async (assign) => {
            try {
              const subRes = await api.get(`/assignments/${assign._id}/submission/me`);
              return { assignId: assign._id, submission: subRes.data.data };
            } catch {
              return { assignId: assign._id, submission: null };
            }
          });
          const subs = await Promise.all(subPromises);
          const subMap = {};
          subs.forEach(s => {
            if (s.submission) subMap[s.assignId] = s.submission;
          });
          setMySubmissions(subMap);
        }
      } else if (tab === 'quizzes') {
        const res = await api.get(`/quizzes/course/${id}`);
        setQuizzes(res.data.data);
      } else if (tab === 'attendance') {
        if (user?.role === 'student') {
          const res = await api.get(`/attendance/student/${user._id}/course/${id}`);
          setMyAttendance(res.data.data);
        } else {
          // Teachers / HOD: Load student roster
          const rosterRes = await api.get(`/courses/${id}/students`);
          setStudentRoster(rosterRes.data.data);
          
          // Prepopulate attendance records as present
          const records = {};
          rosterRes.data.data.forEach(std => {
            records[std._id] = 'present';
          });
          setAttendanceRecords(records);
        }
      } else if (tab === 'exams') {
        const res = await api.get(`/generator/papers/course/${id}`);
        setExamPapers(res.data.data);
      } else if (tab === 'gradesheet') {
        if (user?.role === 'student') {
          const res = await api.get(`/courses/${id}/enrollment/me`);
          setMyEnrollment(res.data.data);
        } else {
          const res = await api.get(`/courses/${id}/gradebook`);
          setGradebookList(res.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load tab data', err);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // --- RESOURCES HANDLERS ---
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newResource.title);
      formData.append('description', newResource.description);
      formData.append('type', newResource.type);
      formData.append('courseId', id);
      
      if (resourceFile) {
        formData.append('file', resourceFile);
      } else if (newResource.externalUrl) {
        formData.append('externalUrl', newResource.externalUrl);
      } else {
        alert('Please select a file or specify an external link URL');
        return;
      }

      const res = await api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setShowResourceModal(false);
        setNewResource({ title: '', description: '', type: 'PDF', externalUrl: '' });
        setResourceFile(null);
        loadTabContent('resources');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  // --- ASSIGNMENTS HANDLERS ---
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newAssignment.title);
      formData.append('description', newAssignment.description);
      formData.append('dueDate', newAssignment.dueDate);
      formData.append('maxPoints', newAssignment.maxPoints);
      formData.append('courseId', id);
      
      if (assignmentFile) {
        formData.append('file', assignmentFile);
      }

      const res = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setShowAssignmentModal(false);
        setNewAssignment({ title: '', description: '', dueDate: '', maxPoints: 50 });
        setAssignmentFile(null);
        loadTabContent('assignments');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleStudentFileSubmit = async (assignId) => {
    const file = submissionFiles[assignId];
    if (!file) {
      alert('Please choose a file to upload first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post(`/assignments/${assignId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('Assignment submitted successfully!');
        loadTabContent('assignments');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    }
  };

  // Open Teacher Gradebook list for an assignment
  const handleOpenGradebook = async (assign) => {
    try {
      setSelectedAssignment(assign);
      const res = await api.get(`/assignments/${assign._id}/submissions`);
      if (res.data.success) {
        setSubmissionsList(res.data.data);
        
        // Initialize inputs
        const grades = {};
        res.data.data.forEach(sub => {
          grades[sub._id] = {
            grade: sub.grade || 0,
            feedback: sub.feedback || ''
          };
        });
        setGradesData(grades);
      }
    } catch (err) {
      alert('Failed to load gradebook submissions');
    }
  };

  const handleGradeSubmit = async (subId) => {
    const data = gradesData[subId];
    try {
      const res = await api.put(`/assignments/submissions/${subId}/grade`, {
        grade: Number(data.grade),
        feedback: data.feedback
      });

      if (res.data.success) {
        alert('Grade saved successfully!');
        if (selectedAssignment) handleOpenGradebook(selectedAssignment);
      }
    } catch (err) {
      alert('Failed to grade submission');
    }
  };

  // --- QUIZ BUILDER HANDLERS ---
  const handleQuizQuestionChange = (index, field, value) => {
    const updatedQs = [...newQuiz.questions];
    updatedQs[index][field] = value;
    setNewQuiz({ ...newQuiz, questions: updatedQs });
  };

  const handleQuizOptionChange = (qIndex, oIndex, value) => {
    const updatedQs = [...newQuiz.questions];
    updatedQs[qIndex].options[oIndex] = value;
    setNewQuiz({ ...newQuiz, questions: updatedQs });
  };

  const handleAddQuizQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]
    });
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/quizzes', {
        title: newQuiz.title,
        duration: newQuiz.duration,
        passingMarks: newQuiz.passingMarks,
        courseId: id,
        questions: newQuiz.questions
      });

      if (res.data.success) {
        setShowQuizModal(false);
        setNewQuiz({
          title: '',
          duration: 10,
          passingMarks: 2,
          questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]
        });
        loadTabContent('quizzes');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create quiz');
    }
  };

  // --- ATTENDANCE HANDLERS ---
  const handleRecordAttendanceChange = (studentId, val) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [studentId]: val
    });
  };

  const handleAttendanceSubmit = async () => {
    try {
      const records = Object.keys(attendanceRecords).map(studentId => ({
        student: studentId,
        status: attendanceRecords[studentId]
      }));

      const res = await api.post('/attendance', {
        courseId: id,
        date: attendanceDate,
        records
      });

      if (res.data.success) {
        alert('Attendance sheet updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  // --- TIMETABLE SCHEDULE HANDLERS ---
  const handleAddScheduleSlot = () => {
    if (!editTempSchedule.room.trim()) return;
    setCourseScheduleList([...courseScheduleList, { ...editTempSchedule }]);
  };

  const handleRemoveScheduleSlot = (index) => {
    setCourseScheduleList(courseScheduleList.filter((_, idx) => idx !== index));
  };

  const handleSaveSchedule = async () => {
    try {
      const res = await api.put(`/courses/${id}`, {
        schedule: courseScheduleList
      });
      if (res.data.success) {
        setCourse(res.data.data);
        setIsEditingSchedule(false);
        alert('Course lecture timetable updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update schedule');
    }
  };
  const handleGradebookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    try {
      const res = await api.put(`/courses/${id}/gradebook/${selectedEnrollment._id}`, editGrades);
      if (res.data.success) {
        alert('Student marks and grades successfully updated!');
        setShowGradeModal(false);
        // Reload gradebook
        const reloadRes = await api.get(`/courses/${id}/gradebook`);
        setGradebookList(reloadRes.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save student grades');
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
      {/* Course Banner Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/60 to-accent-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="space-y-3 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-600/10 text-accent-400 border border-accent-500/20 px-3 py-1 rounded-full">
            {course?.category} Course
          </span>
          <h1 className="text-3xl font-extrabold text-white leading-tight">{course?.name}</h1>
          <p className="text-slate-400 font-medium flex items-center gap-2 text-sm">
            <span className="text-accent-400 font-semibold">{course?.code}</span>
            <span>&bull;</span>
            <span>Credits: {course?.creditHours}</span>
            <span>&bull;</span>
            <span>Coordinator: {course?.teacher?.name}</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl pt-2">{course?.description}</p>
          
          {course?.schedule && course.schedule.length > 0 && (
            <div className="pt-4 border-t border-slate-800/40 mt-4 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent-500" />
                Lecture Timetable & room schedule
              </h4>
              <div className="flex flex-wrap gap-3">
                {course.schedule.map((sched, index) => (
                  <div key={index} className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-white flex items-center gap-1">
                      <span className="text-accent-400">{sched.day}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {sched.startTime} - {sched.endTime}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                      Location: {sched.room}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-800 gap-6 overflow-x-auto">
        {[
          { id: 'resources', label: 'Resources Library', icon: BookOpen },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'quizzes', label: 'MCQ Quizzes', icon: HelpCircle },
          { id: 'attendance', label: 'Attendance', icon: CheckSquare },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'exams', label: 'Exam Papers', icon: FileText },
          { id: 'gradesheet', label: 'Sessional & Gradesheet', icon: Award }
        ].map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`pb-4 px-2 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative ${
                activeTab === t.id
                  ? 'text-accent-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TabIcon className="w-4.5 h-4.5" />
              <span>{t.label}</span>
              {activeTab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}

      {/* TAB 1: RESOURCES */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">Course Materials</h3>
            {user?.role !== 'student' && (
              <button
                onClick={() => setShowResourceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Material</span>
              </button>
            )}
          </div>

          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((res) => (
                <div key={res._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-all">
                  <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700">
                        {res.type}
                      </span>
                      <span className="text-[10px] text-slate-500">{new Date(res.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{res.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{res.description || 'No description provided.'}</p>
                    <div className="pt-2">
                      {res.url.startsWith('/uploads/') ? (
                        <a
                          href={`http://localhost:5000${res.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-accent-400 font-semibold hover:text-accent-300 transition-all bg-accent-500/10 px-2.5 py-1 rounded-lg"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </a>
                      ) : (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-all bg-indigo-500/10 px-2.5 py-1 rounded-lg"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Resource</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No resource materials shared yet.</p>
          )}
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">Homework / Lab Assignments</h3>
            {user?.role !== 'student' && (
              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setShowAssignmentModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Assignment</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {assignments.length > 0 ? (
              assignments.map((assign) => {
                const sub = mySubmissions[assign._id];
                return (
                  <div key={assign._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-all">
                    {/* Assignment Meta */}
                    <div className="space-y-2 max-w-xl">
                      <h4 className="font-bold text-base text-white">{assign.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{assign.description}</p>
                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1 text-rose-400">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(assign.dueDate).toLocaleString()}
                        </span>
                        <span>&bull;</span>
                        <span>Max Score: {assign.maxPoints} pts</span>
                        {assign.fileUrl && (
                          <>
                            <span>&bull;</span>
                            <a
                              href={`http://localhost:5000${assign.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-400 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Instruction Guide</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Student submissions dashboard or Teacher gradebook actions */}
                    <div className="shrink-0 flex flex-col items-start md:items-end gap-3 justify-center">
                      {user?.role === 'student' ? (
                        sub ? (
                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5 text-xs text-right">
                            <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                              {sub.status}
                            </span>
                            <p className="text-slate-400">Graded Score: <span className="font-bold text-white">{sub.grade !== undefined ? `${sub.grade}/${assign.maxPoints}` : 'N/A'}</span></p>
                            {sub.feedback && <p className="text-[10px] text-slate-500 italic max-w-xs leading-snug pt-1">Feedback: "{sub.feedback}"</p>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              onChange={(e) => setSubmissionFiles({ ...submissionFiles, [assign._id]: e.target.files[0] })}
                              className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none file:bg-slate-900 file:border-0 file:text-[10px] file:font-semibold file:text-slate-300"
                            />
                            <button
                              onClick={() => handleStudentFileSubmit(assign._id)}
                              className="flex items-center gap-1 px-3.5 py-1.5 bg-accent-600 hover:bg-accent-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Submit</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => handleOpenGradebook(assign)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl cursor-pointer transition-all"
                        >
                          <span>Open Submissions</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No assignments posted for this course.</p>
            )}
          </div>

          {/* TEACHER GRADEBOOK DRAWER (When selected) */}
          {user?.role !== 'student' && selectedAssignment && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 pt-6 mt-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-base">Grading Panel - {selectedAssignment.title}</h4>
                  <p className="text-xs text-slate-400">Review student submissions and assign points.</p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-slate-400 hover:text-white text-xs font-semibold hover:underline cursor-pointer"
                >
                  Close Gradebook
                </button>
              </div>

              {submissionsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">File URL</th>
                        <th className="pb-3">Submitted At</th>
                        <th className="pb-3">Feedback Comments</th>
                        <th className="pb-3 w-32">Grade / {selectedAssignment.maxPoints}</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {submissionsList.map((sub) => (
                        <tr key={sub._id} className="text-slate-300">
                          <td className="py-4 font-semibold text-white">{sub.student?.name}</td>
                          <td className="py-4">
                            <a
                              href={`http://localhost:5000${sub.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent-400 hover:underline flex items-center gap-1 text-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download file</span>
                            </a>
                          </td>
                          <td className="py-4 text-xs">{new Date(sub.submittedAt).toLocaleString()}</td>
                          <td className="py-4">
                            <input
                              type="text"
                              value={gradesData[sub._id]?.feedback || ''}
                              onChange={(e) => setGradesData({
                                ...gradesData,
                                [sub._id]: { ...gradesData[sub._id], feedback: e.target.value }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs w-48 outline-none focus:border-accent-500"
                              placeholder="Good work. Review..."
                            />
                          </td>
                          <td className="py-4">
                            <input
                              type="number"
                              min="0"
                              max={selectedAssignment.maxPoints}
                              value={gradesData[sub._id]?.grade || 0}
                              onChange={(e) => setGradesData({
                                ...gradesData,
                                [sub._id]: { ...gradesData[sub._id], grade: e.target.value }
                              })}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs w-16 text-center outline-none focus:border-accent-500"
                            />
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleGradeSubmit(sub._id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                            >
                              Save Grade
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No students have uploaded files for this assignment yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg">MCQ Assessments</h3>
            {user?.role !== 'student' && (
              <button
                onClick={() => setShowQuizModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Quiz</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div key={quiz._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-base">{quiz.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-4">
                      <span>Duration: {quiz.duration} mins</span>
                      <span>&bull;</span>
                      <span>Total Questions: {quiz.totalMarks}</span>
                      <span>&bull;</span>
                      <span>Passing Score: {quiz.passingMarks}</span>
                    </p>
                  </div>
                  <div>
                    {user?.role === 'student' ? (
                      <Link
                        to={`/quiz/${quiz._id}`}
                        className="px-4 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-all"
                      >
                        Enter Exam
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Manage via results list</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No active MCQ quizzes scheduled.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <h3 className="font-bold text-white text-lg">Class Attendance Sheets</h3>

          {/* Student View */}
          {user?.role === 'student' && myAttendance && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance Rate</p>
                  <h2 className={`text-4xl font-extrabold mt-2 ${myAttendance.percentage >= 75 ? 'text-emerald-400 text-glow' : 'text-rose-400'}`}>
                    {myAttendance.percentage}%
                  </h2>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Classes Present</p>
                  <h2 className="text-3xl font-extrabold text-white mt-2">{myAttendance.presentCount}</h2>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Classes Late</p>
                  <h2 className="text-3xl font-extrabold text-amber-400 mt-2">{myAttendance.lateCount}</h2>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Classes Absent</p>
                  <h2 className="text-3xl font-extrabold text-rose-450 mt-2">{myAttendance.absentCount}</h2>
                </div>
              </div>

              {/* Detailed Session Logs Table */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Session-by-Session Lecture Logs</h4>
                {myAttendance.logs && myAttendance.logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/10">
                          <th className="p-3 font-semibold">Session Date</th>
                          <th className="p-3 font-semibold">Lecture Time</th>
                          <th className="p-3 font-semibold text-right">My Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {myAttendance.logs.map((log, index) => {
                          const dateObj = new Date(log.date);
                          return (
                            <tr key={index} className="text-slate-300 hover:bg-slate-900/10 transition-all">
                              <td className="p-3 font-semibold text-white">
                                {dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="p-3 text-xs text-slate-500">
                                {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="p-3 text-right">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  log.status === 'present'
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                    : log.status === 'absent'
                                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                                    : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No individual lecture logs found for this course.</p>
                )}
              </div>
            </div>
          )}

          {/* Teacher View */}
          {user?.role !== 'student' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-white">Log Class Roll List</h4>
                  <p className="text-xs text-slate-400">Select date and log presence statuses.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Class Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              {studentRoster.length > 0 ? (
                <div className="space-y-4">
                  <div className="divide-y divide-slate-800/40">
                    {studentRoster.map((std) => (
                      <div key={std._id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-400">
                            {std.name.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-semibold text-sm text-white">{std.name}</h5>
                            <p className="text-[10px] text-slate-500">{std.email}</p>
                          </div>
                        </div>

                        {/* Status Pickers */}
                        <div className="flex items-center gap-4">
                          {['present', 'absent', 'late'].map((status) => (
                            <label
                              key={status}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all ${
                                attendanceRecords[std._id] === status
                                  ? status === 'present'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : status === 'absent'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-450'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`attendance-${std._id}`}
                                checked={attendanceRecords[std._id] === status}
                                onChange={() => handleRecordAttendanceChange(std._id, status)}
                                className="hidden"
                              />
                              <span className="capitalize">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800/60">
                    <button
                      onClick={handleAttendanceSubmit}
                      className="px-5 py-2.5 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-accent-500/5 flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Save Attendance Sheet</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No students enrolled in this course yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Lecture Timetable</h3>
              <p className="text-xs text-slate-400">Scheduled days, timings, and classrooms for this course.</p>
            </div>
            {user?.role !== 'student' && (
              <button
                onClick={() => setIsEditingSchedule(!isEditingSchedule)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-accent-400 font-semibold text-xs rounded-lg transition-all cursor-pointer"
              >
                {isEditingSchedule ? 'View Schedule' : 'Manage Schedule'}
              </button>
            )}
          </div>

          {/* Edit schedule mode (Teacher / Admin / HOD) */}
          {isEditingSchedule && user?.role !== 'student' ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure Slots</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">Day</label>
                    <select
                      value={editTempSchedule.day}
                      onChange={(e) => setEditTempSchedule({ ...editTempSchedule, day: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
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
                      value={editTempSchedule.room}
                      onChange={(e) => setEditTempSchedule({ ...editTempSchedule, room: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                      placeholder="e.g. Room 201"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">Start Time</label>
                    <input
                      type="text"
                      value={editTempSchedule.startTime}
                      onChange={(e) => setEditTempSchedule({ ...editTempSchedule, startTime: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                      placeholder="e.g. 09:00 AM"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">End Time</label>
                    <input
                      type="text"
                      value={editTempSchedule.endTime}
                      onChange={(e) => setEditTempSchedule({ ...editTempSchedule, endTime: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                      placeholder="e.g. 10:30 AM"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddScheduleSlot}
                    className="px-3 py-1 bg-slate-900 border border-slate-800 text-accent-400 font-semibold text-[10px] uppercase rounded-lg hover:bg-slate-850 cursor-pointer"
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              {/* Slots List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Scheduled Slots</h4>
                {courseScheduleList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseScheduleList.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="space-y-1">
                          <p className="font-bold text-white text-sm">{slot.day}</p>
                          <p className="text-xs text-slate-400">{slot.startTime} - {slot.endTime}</p>
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Room: {slot.room}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleSlot(index)}
                          className="p-1.5 text-rose-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all font-bold cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No slots configured. Course will not show on timetables.</p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800/60">
                <button
                  onClick={handleSaveSchedule}
                  className="px-5 py-2.5 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Save Schedule Changes
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {course?.schedule && course.schedule.length > 0 ? (
                course.schedule.map((sched, index) => (
                  <div key={index} className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition-all glow-card-accent">
                    <div className="p-3 bg-accent-600/10 text-accent-400 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-base text-white">{sched.day}</h4>
                      <p className="text-sm text-slate-350 flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {sched.startTime} - {sched.endTime}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        Location: {sched.room}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                  No lecture timetable slots scheduled for this course.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: EXAM PAPERS */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Course Exam Papers</h3>
              <p className="text-xs text-slate-400 font-medium">AI-generated Midterm, Final, and Quiz papers approved by department faculty.</p>
            </div>
            {(user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'hod') && (
              <Link
                to="/generator"
                className="px-3.5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-accent-500/5 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>AI Generator Wizard</span>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {examPapers.length > 0 ? (
              examPapers.map((paper) => (
                <div key={paper._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all glow-card-accent">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                        paper.paperType === 'Final'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : paper.paperType === 'Midterm'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          : 'bg-accent-500/10 border-accent-500/20 text-accent-400'
                      }`}>
                        {paper.paperType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                        Marks: {paper.totalMarks}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-white">{paper.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <span>Source: {paper.pdfName}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        Difficulty: <span className="capitalize font-semibold text-slate-400">{paper.difficulty}</span> &bull; By: {paper.teacher?.name || 'Faculty'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {paper.questions?.length || 0} questions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-6">
                    <span className="text-[10px] text-slate-500">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {user?.role !== 'student' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this exam paper?')) {
                              try {
                                const deleteRes = await api.delete(`/generator/papers/${paper._id}`);
                                if (deleteRes.data.success) {
                                  alert('Exam paper removed successfully.');
                                  const res = await api.get(`/generator/papers/course/${id}`);
                                  setExamPapers(res.data.data);
                                }
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to delete paper');
                              }
                            }
                          }}
                          className="px-2 py-1.5 bg-slate-950 border border-slate-850 hover:border-rose-900/40 text-rose-450 hover:text-rose-400 text-xs font-bold rounded-lg cursor-pointer transition-all"
                        >
                          Delete
                        </button>
                      )}

                      {/* View Paper button — shows questions inline for students */}
                      <button
                        onClick={() => setViewingPaper(paper)}
                        className="px-3 py-1.5 bg-accent-600/15 hover:bg-accent-600/25 border border-accent-500/20 text-accent-400 hover:text-accent-300 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Paper</span>
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const exportRes = await api.post('/generator/export-pdf', {
                              title: paper.title,
                              courseCode: course?.code,
                              courseName: course?.name,
                              paperType: paper.paperType,
                              totalMarks: paper.totalMarks,
                              questions: paper.questions
                            }, {
                              responseType: 'blob'
                            });
                            
                            const fileUrl = window.URL.createObjectURL(new Blob([exportRes.data]));
                            const fileLink = document.createElement('a');
                            fileLink.href = fileUrl;
                            fileLink.setAttribute('download', `${paper.paperType.toLowerCase()}_exam.pdf`);
                            document.body.appendChild(fileLink);
                            fileLink.click();
                            fileLink.remove();
                          } catch (err) {
                            console.error('Failed to download exam PDF', err);
                            alert('Failed to download PDF document');
                          }
                        }}
                        className="px-3 py-1.5 bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-500 text-sm glass-panel border border-slate-800 rounded-2xl">
                No archived exam papers found for this course.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: SESSIONAL & GRADESHEET */}
      {activeTab === 'gradesheet' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Course Sessional & Gradesheet</h3>
              <p className="text-xs text-slate-400 font-medium">
                {user?.role === 'student' 
                  ? 'Your verified marksheet and sessional grades for this course.'
                  : 'Manage and update sessional scores, midterms, final exam grades, and course statuses.'}
              </p>
            </div>
          </div>

          {/* Student Portal Grade Card View */}
          {user?.role === 'student' && myEnrollment && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Detailed Breakdown */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Marksheet Split Breakdown</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Assignment Marks</span>
                    <span className="text-sm font-bold text-white">{myEnrollment.assignmentMarks || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Quiz Assessments</span>
                    <span className="text-sm font-bold text-white">{myEnrollment.quizMarks || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Midterm Exam</span>
                    <span className="text-sm font-bold text-white">{myEnrollment.midtermMarks || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Final Exam</span>
                    <span className="text-sm font-bold text-white">{myEnrollment.finalMarks || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Class Sessional Activities</span>
                    <span className="text-sm font-bold text-white">{myEnrollment.sessionalMarks || 0}</span>
                  </div>
                  <div className="bg-accent-600/10 p-4 rounded-xl border border-accent-500/20 flex justify-between items-center">
                    <span className="text-xs text-accent-400 font-bold">Total Aggregated Score</span>
                    <span className="text-sm font-extrabold text-white">{myEnrollment.totalMarks || 0} / 100</span>
                  </div>
                </div>
              </div>

              {/* Final Grade Card */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 text-center self-start bg-gradient-to-br from-slate-900 to-accent-950/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Course Outcome</h4>
                <div className="py-6 space-y-2">
                  <div className="text-6xl font-extrabold text-glow text-accent-400">
                    {myEnrollment.grade || 'N/A'}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Grade Point: {myEnrollment.gradePoints?.toFixed(2) || '0.00'} / 4.00</p>
                </div>
                <div className="border-t border-slate-800/60 pt-4 text-xs flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={`capitalize font-bold ${
                    myEnrollment.status === 'completed'
                      ? 'text-emerald-400'
                      : myEnrollment.status === 'dropped'
                      ? 'text-rose-400'
                      : 'text-accent-400'
                  }`}>{myEnrollment.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Gradebook Table View */}
          {user?.role !== 'student' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <h4 className="font-bold text-white text-base">Student Marksheet Roster</h4>
              
              {gradebookList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 pl-2">Student</th>
                        <th className="pb-3 text-center">Quizzes</th>
                        <th className="pb-3 text-center">Assignments</th>
                        <th className="pb-3 text-center">Midterm</th>
                        <th className="pb-3 text-center">Final</th>
                        <th className="pb-3 text-center">Sessional</th>
                        <th className="pb-3 text-center font-bold text-white">Total (/100)</th>
                        <th className="pb-3 text-center font-bold text-accent-400">Grade</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {gradebookList.map((enroll) => (
                        <tr key={enroll._id} className="text-slate-350 hover:bg-slate-900/10 transition-all">
                          <td className="py-4 pl-2">
                            <div className="font-semibold text-white">{enroll.student?.name}</div>
                            <div className="text-[10px] text-slate-500">{enroll.student?.email}</div>
                          </td>
                          <td className="py-4 text-center">{enroll.quizMarks || 0}</td>
                          <td className="py-4 text-center">{enroll.assignmentMarks || 0}</td>
                          <td className="py-4 text-center">{enroll.midtermMarks || 0}</td>
                          <td className="py-4 text-center">{enroll.finalMarks || 0}</td>
                          <td className="py-4 text-center">{enroll.sessionalMarks || 0}</td>
                          <td className="py-4 text-center font-bold text-white text-sm">{enroll.totalMarks || 0}</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-accent-600/15 border border-accent-500/25 text-accent-400 font-extrabold text-xs">
                              {enroll.grade || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`capitalize text-[10px] font-bold ${
                              enroll.status === 'completed' 
                                ? 'text-emerald-400' 
                                : enroll.status === 'dropped' 
                                ? 'text-rose-450' 
                                : 'text-accent-400'
                            }`}>
                              {enroll.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <button
                              onClick={() => {
                                setSelectedEnrollment(enroll);
                                setEditGrades({
                                  midtermMarks: enroll.midtermMarks || 0,
                                  finalMarks: enroll.finalMarks || 0,
                                  sessionalMarks: enroll.sessionalMarks || 0,
                                  assignmentMarks: enroll.assignmentMarks || 0,
                                  quizMarks: enroll.quizMarks || 0,
                                  grade: enroll.grade || '',
                                  status: enroll.status || 'active'
                                });
                                setShowGradeModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-350 hover:text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                            >
                              Enter Grades
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-6">No enrolled students in this course yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* GRADEBOOK EDITOR MODAL */}
      {showGradeModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Record Sessional Grades</h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Student: {selectedEnrollment.student?.name}</p>
              </div>
              <button 
                onClick={() => setShowGradeModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGradebookSubmit}>
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Quizzes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Quiz Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editGrades.quizMarks}
                      onChange={(e) => setEditGrades({ ...editGrades, quizMarks: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                    />
                  </div>

                  {/* Assignments */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Assignment Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editGrades.assignmentMarks}
                      onChange={(e) => setEditGrades({ ...editGrades, assignmentMarks: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                    />
                  </div>

                  {/* Midterm */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Midterm Exam Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editGrades.midtermMarks}
                      onChange={(e) => setEditGrades({ ...editGrades, midtermMarks: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                    />
                  </div>

                  {/* Final */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Final Exam Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editGrades.finalMarks}
                      onChange={(e) => setEditGrades({ ...editGrades, finalMarks: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                    />
                  </div>

                  {/* Sessional */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Sessional Activities Marks</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editGrades.sessionalMarks}
                      onChange={(e) => setEditGrades({ ...editGrades, sessionalMarks: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 text-white"
                    />
                  </div>

                  {/* Total Score Display */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Accumulated Total</label>
                    <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-extrabold">
                      {(Number(editGrades.quizMarks) || 0) + 
                       (Number(editGrades.assignmentMarks) || 0) + 
                       (Number(editGrades.midtermMarks) || 0) + 
                       (Number(editGrades.finalMarks) || 0) + 
                       (Number(editGrades.sessionalMarks) || 0)} / 100
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Status</label>
                    <select
                      value={editGrades.status}
                      onChange={(e) => setEditGrades({ ...editGrades, status: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none text-white focus:border-accent-500"
                    >
                      <option value="active">Active</option>
                      <option value="dropped">Dropped</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Letter Grade Override */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Overall Grade Override</label>
                    <select
                      value={editGrades.grade}
                      onChange={(e) => setEditGrades({ ...editGrades, grade: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none text-white focus:border-accent-500"
                    >
                      <option value="">Auto Calculate Grade</option>
                      <option value="A">A (Excellent)</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B">B (Good)</option>
                      <option value="B-">B-</option>
                      <option value="C+">C+</option>
                      <option value="C">C (Satisfactory)</option>
                      <option value="D">D (Pass)</option>
                      <option value="F">F (Fail)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 p-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Save Grades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOURCE MODAL */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Upload Syllabus Resource</h3>
              <button onClick={() => setShowResourceModal(false)} className="text-slate-400 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResourceSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Resource Title</label>
                <input
                  type="text"
                  required
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  placeholder="e.g. Stanford ML Notes"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                <textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 h-16"
                  placeholder="Summarize file details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Type</label>
                  <select
                    value={newResource.type}
                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  >
                    <option value="PDF">PDF File</option>
                    <option value="Research Paper">Research Paper</option>
                    <option value="Lecture Notes">Lecture Notes</option>
                    <option value="AI Dataset">AI Dataset</option>
                    <option value="YouTube Link">YouTube Link</option>
                    <option value="GitHub Repo">GitHub Repo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Link Option</label>
                  <select
                    value={resourceFile ? 'file' : 'link'}
                    onChange={(e) => {
                      if (e.target.value === 'file') setNewResource({ ...newResource, externalUrl: '' });
                      else setResourceFile(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  >
                    <option value="file">Upload File</option>
                    <option value="link">URL / Link</option>
                  </select>
                </div>
              </div>

              {resourceFile === null && (newResource.type === 'YouTube Link' || newResource.type === 'GitHub Repo' || !resourceFile) ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">External Link URL</label>
                  <input
                    type="url"
                    value={newResource.externalUrl}
                    onChange={(e) => setNewResource({ ...newResource, externalUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                    placeholder="https://github.com/..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Choose File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setResourceFile(e.target.files[0])}
                    className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 w-full outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Assignment Sheet</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="text-slate-400 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignmentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  placeholder="e.g. Lab 1: Numpy Vectors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Instructions</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 h-20"
                  placeholder="Provide brief guidelines..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Due Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Max Score (pts)</label>
                  <input
                    type="number"
                    min="1"
                    value={newAssignment.maxPoints}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxPoints: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Attach Template File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setAssignmentFile(e.target.files[0])}
                  className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-2 w-full outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-855">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-3.5 py-2 bg-slate-855 hover:bg-slate-800 text-slate-350 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MCQ QUIZ BUILDER MODAL */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Configure MCQ Exam</h3>
              <button onClick={() => setShowQuizModal(false)} className="text-slate-400 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Form Scrollable */}
            <form onSubmit={handleQuizSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                    placeholder="e.g. Deep Learning ConvNets Test"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Timer (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuiz.duration}
                    onChange={(e) => setNewQuiz({ ...newQuiz, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Passing Score (Min. Questions Correct)</label>
                <input
                  type="number"
                  min="1"
                  value={newQuiz.passingMarks}
                  onChange={(e) => setNewQuiz({ ...newQuiz, passingMarks: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500 w-32"
                />
              </div>

              {/* Questions Area */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">MCQ Roster ({newQuiz.questions.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddQuizQuestion}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-accent-400 font-semibold text-[10px] uppercase rounded-lg transition-all"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-6">
                  {newQuiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Question {qIndex + 1}</label>
                        <input
                          type="text"
                          required
                          value={q.questionText}
                          onChange={(e) => handleQuizQuestionChange(qIndex, 'questionText', e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                          placeholder="What does ReLU stand for?"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex}>
                            <label className="block text-[9px] font-semibold text-slate-600 mb-1 uppercase">Option {oIndex + 1}</label>
                            <input
                              type="text"
                              required
                              value={option}
                              onChange={(e) => handleQuizOptionChange(qIndex, oIndex, e.target.value)}
                              className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-accent-500"
                              placeholder={`Choice ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 mb-1 uppercase">Correct Answer Choice</label>
                        <select
                          value={q.correctAnswer}
                          onChange={(e) => handleQuizQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))}
                          className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-xs outline-none focus:border-accent-500"
                        >
                          <option value="0">Option 1</option>
                          <option value="1">Option 2</option>
                          <option value="2">Option 3</option>
                          <option value="3">Option 4</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-850 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Schedule Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EXAM PAPER VIEWER MODAL */}
      {viewingPaper && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl my-8 relative overflow-hidden">
            {/* Decorative gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-accent-600 via-indigo-500 to-accent-400" />

            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                    viewingPaper.paperType === 'Final'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : viewingPaper.paperType === 'Midterm'
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      : 'bg-accent-500/10 border-accent-500/20 text-accent-400'
                  }`}>
                    {viewingPaper.paperType} Examination
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border bg-slate-800 border-slate-700 text-slate-400 capitalize">
                    {viewingPaper.difficulty}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white leading-tight">{viewingPaper.title}</h2>
                <p className="text-xs text-slate-400">
                  Course: <span className="text-white font-semibold">{course?.name}</span> &bull;
                  Total Marks: <span className="text-white font-semibold">{viewingPaper.totalMarks}</span> &bull;
                  By: <span className="text-accent-400 font-semibold">{viewingPaper.teacher?.name || 'Faculty'}</span>
                </p>
              </div>
              <button
                onClick={() => setViewingPaper(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions List */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Group questions by type */}
              {(() => {
                const groups = [
                  { key: 'mcq', label: 'Section A — Multiple Choice Questions', color: 'text-accent-400 bg-accent-500/10 border-accent-500/20' },
                  { key: 'true_false', label: 'Section B — True / False', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  { key: 'fill_in_the_blank', label: 'Section C — Fill in the Blanks', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { key: 'short_question', label: 'Section D — Short Answer Questions', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                  { key: 'long_question', label: 'Section E — Essay / Long Questions', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                ];

                return groups.map((group) => {
                  const groupQs = (viewingPaper.questions || []).filter(q => q.type === group.key);
                  if (groupQs.length === 0) return null;

                  return (
                    <div key={group.key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${group.color}`}>
                          {group.label} ({groupQs.length} Q)
                        </span>
                      </div>

                      {groupQs.map((q, qIdx) => (
                        <div key={qIdx} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {qIdx + 1}
                            </span>
                            <p className="text-sm text-white font-medium leading-relaxed pt-0.5">{q.questionText}</p>
                          </div>

                          {/* MCQ Options */}
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className="px-3 py-2 rounded-xl border text-xs flex items-center gap-2 bg-slate-900/50 border-slate-800 text-slate-300"
                                >
                                  <span className="w-5 h-5 shrink-0 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* True/False marker */}
                          {q.type === 'true_false' && (
                            <div className="pl-10 flex gap-2">
                              {['True', 'False'].map(tf => (
                                <span key={tf} className="px-4 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs text-slate-300 font-medium">{tf}</span>
                              ))}
                            </div>
                          )}

                          {/* Fill blank / Short / Long — answer lines */}
                          {(q.type === 'fill_in_the_blank' || q.type === 'short_question' || q.type === 'long_question') && (
                            <div className="pl-10 space-y-1">
                              {Array.from({ length: q.type === 'long_question' ? 5 : q.type === 'short_question' ? 3 : 1 }).map((_, lIdx) => (
                                <div key={lIdx} className="h-7 border-b border-dashed border-slate-700" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-950/30">
              <p className="text-[10px] text-slate-500 font-medium">
                {viewingPaper.questions?.length || 0} total questions &bull; Source: {viewingPaper.pdfName}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingPaper(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default CourseDetail;
