import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';

// Placeholder components for modules not requested yet

const AnalyticsPlaceholder: React.FC = () => (
  <div className="glass-card rounded-2xl p-8 text-center space-y-3">
    <h2 className="text-xl font-bold tracking-tight">Analytics Dashboard</h2>
    <p className="text-sm text-app-text-muted max-w-md mx-auto">
      Detailed cash flow forecasting, spending heatmaps, and category breakdowns will show up here.
    </p>
  </div>
);

const BudgetsPlaceholder: React.FC = () => (
  <div className="glass-card rounded-2xl p-8 text-center space-y-3">
    <h2 className="text-xl font-bold tracking-tight">Budget Planner</h2>
    <p className="text-sm text-app-text-muted max-w-md mx-auto">
      Set target boundaries for categories like Food, Utilities, and Shopping, and monitor alerts.
    </p>
  </div>
);

const RecurringPlaceholder: React.FC = () => (
  <div className="glass-card rounded-2xl p-8 text-center space-y-3">
    <h2 className="text-xl font-bold tracking-tight">Recurring Payments</h2>
    <p className="text-sm text-app-text-muted max-w-md mx-auto">
      Monitor your active monthly SaaS subscriptions, utility direct debits, and automatic income payouts.
    </p>
  </div>
);

const SettingsPlaceholder: React.FC = () => (
  <div className="glass-card rounded-2xl p-8 text-center space-y-3">
    <h2 className="text-xl font-bold tracking-tight">User Settings</h2>
    <p className="text-sm text-app-text-muted max-w-md mx-auto">
      Manage profile details, update password hashes, customize theme preferences, or reset tracking sessions.
    </p>
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes Layout Wrapper */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="analytics" element={<AnalyticsPlaceholder />} />
                <Route path="budgets" element={<BudgetsPlaceholder />} />
                <Route path="recurring" element={<RecurringPlaceholder />} />
                <Route path="settings" element={<SettingsPlaceholder />} />
              </Route>

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
