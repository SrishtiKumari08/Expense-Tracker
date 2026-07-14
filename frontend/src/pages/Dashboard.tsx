import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import ExpenseModal from '../components/ExpenseModal';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRight, FileDown, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Expense {
  _id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending';
}

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Row Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-app-border rounded w-24" />
              <div className="h-10 w-10 rounded-xl bg-app-border" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 bg-app-border rounded w-32" />
              <div className="h-3 bg-app-border rounded w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Widgets Skeleton */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent activity skeleton */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-app-border rounded w-28" />
            <div className="h-4 bg-app-border rounded w-16" />
          </div>
          <div className="divide-y divide-app-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-app-border" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-app-border rounded w-24" />
                    <div className="h-3 bg-app-border rounded w-32" />
                  </div>
                </div>
                <div className="h-4 bg-app-border rounded w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Budget goal skeleton */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="h-5 bg-app-border rounded w-28" />
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-10 border-app-border/40 animate-pulse" />
              <div className="h-3 bg-app-border rounded w-48 mt-4" />
            </div>
          </div>
          <div className="border-t border-app-border pt-4 mt-4">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-app-border rounded w-12" />
              <div className="h-5 bg-app-border rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await API.get('/expenses');
      setExpenses(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to sync dashboard metrics.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute stats
  const totalIncome = expenses
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  // Budget calculations (default budget limit from user settings)
  const budgetLimit = user?.monthlyBudget || 5000;
  const budgetSpentPercent = budgetLimit > 0 ? Math.min(Math.round((totalExpenses / budgetLimit) * 100), 100) : 0;

  const metrics = [
    {
      title: 'Current Balance',
      amount: `$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Net available cash flow',
      icon: Wallet,
      color: 'from-blue-500/10 to-indigo-500/10 text-indigo-500 border-indigo-500/20',
    },
    {
      title: 'Total Income',
      amount: `$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'All tracked income streams',
      icon: ArrowUpRight,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-500/20',
    },
    {
      title: 'Total Expenses',
      amount: `$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'All outgoing transactions',
      icon: ArrowDownRight,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-500/20',
    },
  ];

  // Get 5 most recent transactions
  const recentTransactions = expenses.slice(0, 5);

  const handleModalSave = () => {
    fetchDashboardData(true);
  };

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
          <button 
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-2 rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium hover:bg-app-bg transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Manage Logs
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
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
                    <p className="mt-1 text-xs text-app-text-muted">
                      {metric.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Grid Widgets */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Side: Recent Transactions */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
                  <button 
                    onClick={() => navigate('/expenses')}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    View All
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="divide-y divide-app-border">
                  {recentTransactions.length === 0 ? (
                    <div className="py-12 text-center text-sm text-app-text-muted">
                      No transactions recorded yet. Click "Add Transaction" to start.
                    </div>
                  ) : (
                    recentTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      return (
                        <div key={tx._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 font-medium">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm shrink-0 ${
                              isIncome 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-app-bg text-app-text-muted'
                            }`}>
                              {tx.description.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-app-text">{tx.description}</p>
                              <p className="text-xs text-app-text-muted font-normal">
                                {tx.category} • {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${isIncome ? 'text-emerald-500' : 'text-app-text'}`}>
                            {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
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
                        strokeDashoffset={2 * Math.PI * 58 * (1 - budgetSpentPercent / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="72"
                        cy="72"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-2xl font-extrabold tracking-tight">{budgetSpentPercent}%</span>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-app-text-muted mt-0.5">Used</p>
                    </div>
                  </div>
                  <p className="text-xs text-app-text-muted mt-4 text-center">
                    You have spent <span className="font-semibold text-app-text">${totalExpenses.toFixed(2)}</span> of your total budget limit <span className="font-semibold text-app-text">${budgetLimit}</span>.
                  </p>
                </div>
              </div>

              <div className="border-t border-app-border pt-4 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-app-text-muted">Status</span>
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold ${
                    budgetSpentPercent < 80 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : budgetSpentPercent < 100 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {budgetSpentPercent < 80 ? 'On Track' : budgetSpentPercent < 100 ? 'Warning' : 'Limit Exceeded'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default Dashboard;
