import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import ExpenseModal from '../components/ExpenseModal';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRight, FileDown, Plus } from 'lucide-react';

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

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  // Budget calculations (default budget limit of $5000)
  const budgetLimit = 5000;
  const budgetSpentPercent = Math.min(Math.round((totalExpenses / budgetLimit) * 100), 100);

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
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm text-app-text-muted font-medium">Loading financial metrics...</p>
        </div>
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
                        <div key={tx._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${
                              isIncome 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-app-bg text-app-text-muted'
                            }`}>
                              {tx.description.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{tx.description}</p>
                              <p className="text-xs text-app-text-muted">
                                {tx.category} • {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${isIncome ? 'text-emerald-500' : 'text-app-text'}`}>
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
        onSave={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
