import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#F8FAFC', color: '#0F172A' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8" style={{ background: '#F8FAFC' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
