import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Resources from './pages/Resources';
import Notices from './pages/Notices';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import QuizInterface from './pages/QuizInterface';
import Timetable from './pages/Timetable';
import QuizPaperGenerator from './pages/QuizPaperGenerator';
import AdminPanel from './pages/AdminPanel';

// [NEW PAGES IMPORTS]
import CareerAdvisor from './pages/CareerAdvisor';
import StudyPlanner from './pages/StudyPlanner';
import CampusNavigation from './pages/CampusNavigation';
import TeacherStudentChat from './pages/TeacherStudentChat';
import DigitalID from './pages/DigitalID';
import ExamPrep from './pages/ExamPrep';
import SemesterPredictor from './pages/SemesterPredictor';
import ExamInchargePanel from './pages/ExamInchargePanel';
import AccountantPanel from './pages/AccountantPanel';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Timed MCQ Quiz attempt portal (Full screen lock view) */}
        <Route path="/quiz/:quizId" element={<QuizInterface />} />

        {/* Private Protected Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="resources" element={<Resources />} />
          <Route path="notices" element={<Notices />} />
          <Route path="users" element={<Users />} />
          <Route path="analytics" element={ <Analytics /> } />
          <Route path="timetable" element={<Timetable />} />
          <Route path="generator" element={<QuizPaperGenerator />} />
          <Route path="admin-panel" element={<AdminPanel />} />
          
          {/* [NEW MODULES ROUTES] */}
          <Route path="career-advisor" element={<CareerAdvisor />} />
          <Route path="study-planner" element={<StudyPlanner />} />
          <Route path="campus-navigation" element={<CampusNavigation />} />
          <Route path="chat" element={<TeacherStudentChat />} />
          <Route path="digital-id" element={<DigitalID />} />
          <Route path="exam-prep" element={<ExamPrep />} />
          <Route path="semester-predictor" element={<SemesterPredictor />} />
          <Route path="exam-incharge-panel" element={<ExamInchargePanel />} />
          <Route path="accountant-panel" element={<AccountantPanel />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
