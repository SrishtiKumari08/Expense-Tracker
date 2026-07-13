import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export const Layout: React.FC = () => {
  const { token, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If loading auth state, show a premium loading indicator
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent shadow-lg shadow-indigo-500/10" />
          <p className="text-sm font-medium text-app-text-muted">Initializing SpendWise...</p>
        </div>
      </div>
    );
  }

  // Guard routing - redirect to login if unauthorized
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text transition-colors duration-200">
      {/* Decorative background glow blobs for dark mode premium visual aesthetic */}
      <div className="glow-bg top-[-100px] left-[-100px] opacity-70" />
      <div className="glow-bg bottom-[-200px] right-[-100px] opacity-40" />

      {/* Header bar */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main body split container */}
      <div className="relative flex flex-1">
        {/* Navigation panel */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Content canvas */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 z-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default Layout;
