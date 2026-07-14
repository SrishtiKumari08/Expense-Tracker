import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, TrendingDown, BarChart3, Settings, LogOut, X, CreditCard, History } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Expenses', path: '/expenses', icon: TrendingDown },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Budgets', path: '/budgets', icon: CreditCard },
    { name: 'Payment History', path: '/payments', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-[var(--sidebar-w)] flex-col border-r border-app-border bg-app-card transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button header */}
        <div className="flex h-16 items-center justify-between px-6 md:hidden">
          <span className="text-lg font-bold tracking-tight">Navigation</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-bg hover:text-app-text"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop spacer - replaces navbar logo height */}
        <div className="hidden h-16 items-center px-6 md:flex">
          <span className="text-xs font-semibold tracking-wider text-app-text-muted uppercase">
            Menu
          </span>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 space-y-1.5 px-4 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose} // Auto close on mobile navigation
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 text-brand-primary border-l-4 border-brand-primary font-semibold shadow-sm'
                    : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-brand-primary' : 'text-app-text-muted group-hover:text-app-text'
                  }`}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout bottom container */}
        <div className="border-t border-app-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-brand-accent hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
