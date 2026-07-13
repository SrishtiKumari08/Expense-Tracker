import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRight, FileDown } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Premium mock stats
  const metrics = [
    {
      title: 'Current Balance',
      amount: '$14,240.50',
      change: '+12% from last month',
      isPositive: true,
      icon: Wallet,
      color: 'from-blue-500/10 to-indigo-500/10 text-indigo-500 border-indigo-500/20',
    },
    {
      title: 'Monthly Income',
      amount: '$5,820.00',
      change: '+4% since June',
      isPositive: true,
      icon: ArrowUpRight,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-500/20',
    },
    {
      title: 'Monthly Expenses',
      amount: '$2,580.20',
      change: '-8% from average',
      isPositive: false,
      icon: ArrowDownRight,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-500/20',
    },
  ];

  // Premium mock transactions
  const transactions = [
    { id: 1, name: 'AWS Cloud Server', category: 'Infrastructure', amount: -49.99, date: 'Today, 2:40 PM' },
    { id: 2, name: 'Salary Paycheck', category: 'Income', amount: 2910.00, date: 'Jul 12, 9:00 AM' },
    { id: 3, name: 'Figma Pro Plan', category: 'Software', amount: -15.00, date: 'Jul 10, 4:15 PM' },
    { id: 4, name: 'Organic Groceries', category: 'Food & Dining', amount: -124.50, date: 'Jul 09, 11:30 AM' },
    { id: 5, name: 'Uber Ride', category: 'Transportation', amount: -18.25, date: 'Jul 08, 8:12 PM' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-app-text-muted mt-1">
            Welcome back, <span className="font-semibold text-app-text">{user?.name}</span>! Here is your financial overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium hover:bg-app-bg transition-colors">
            <FileDown className="h-4 w-4" />
            Export Data
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity">
            Add Expense
          </button>
        </div>
      </div>

      {/* Metrics Rows */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.01] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-app-text-muted">{metric.title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-tr ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight sm:text-3xl">{metric.amount}</span>
                <p className="mt-1 flex items-center gap-1.5 text-xs">
                  <span className={metric.isPositive ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
                    {metric.change.split(' ')[0]}
                  </span>
                  <span className="text-app-text-muted">{metric.change.substring(metric.change.indexOf(' '))}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Widgets */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Recent Transactions */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
            <button className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">
              View All
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-app-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${
                    tx.amount > 0 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-app-bg text-app-text-muted'
                  }`}>
                    {tx.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{tx.name}</p>
                    <p className="text-xs text-app-text-muted">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-500' : ''}`}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Budget Goals */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight">Monthly Budget</h2>
            
            {/* Visual Progress Arc/Meter */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex h-36 w-36 items-center justify-center">
                {/* SVG Ring Meter */}
                <svg className="absolute transform -rotate-90" width="144" height="144">
                  <circle
                    className="text-app-border"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="72"
                    cy="72"
                  />
                  <circle
                    className="text-brand-primary"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={2 * Math.PI * 58 * (1 - 0.443)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="72"
                    cy="72"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-2xl font-extrabold tracking-tight">44%</span>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-app-text-muted mt-0.5">Used</p>
                </div>
              </div>
              <p className="text-xs text-app-text-muted mt-4 text-center">
                You have spent <span className="font-semibold text-app-text">$2,580.20</span> of your total budget limit <span className="font-semibold text-app-text">$5,800</span>.
              </p>
            </div>
          </div>

          <div className="border-t border-app-border pt-4 mt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-app-text-muted">Status</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-500">
                On Track
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
