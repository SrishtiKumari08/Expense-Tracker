import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, Bell, User, LogOut, Settings, Wallet } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-app-border backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Side: Brand Logo and Hamburger toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-app-text md:hidden focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary text-white shadow-lg shadow-indigo-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Spend<span className="text-gradient">Wise</span>
            </span>
          </div>
        </div>

        {/* Right Side: Quick Action utilities, Theme switch, Notifications, User details */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-app-text transition-colors duration-150"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </button>

          {/* Notifications Button */}
          <button
            className="relative rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-app-text transition-colors duration-150"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-brand-accent animate-ping" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-brand-accent" />
          </button>

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-app-border" />

          {/* Profile User Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 rounded-lg p-1.5 text-left focus:outline-none hover:bg-app-bg transition-colors duration-150"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-brand-primary border border-indigo-500/20 font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs text-app-text-muted mt-0.5">{user.email}</p>
                </div>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-app-border bg-app-card p-1 shadow-lg z-20 focus:outline-none animate-in fade-in-50 slide-in-from-top-1">
                    <div className="px-3 py-2 text-xs text-app-text-muted border-b border-app-border mb-1">
                      My Account
                    </div>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-app-text hover:bg-app-bg transition-colors"
                    >
                      <User className="h-4 w-4 text-app-text-muted" />
                      Profile
                    </button>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-app-text hover:bg-app-bg transition-colors"
                    >
                      <Settings className="h-4 w-4 text-app-text-muted" />
                      Settings
                    </button>
                    <div className="my-1 border-t border-app-border" />
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-accent hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
