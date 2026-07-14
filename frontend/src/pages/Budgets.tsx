import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, Save, AlertTriangle, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';

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

export const Budgets: React.FC = () => {
  const { user, updateBudget } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget states
  const currentBudget = user?.monthlyBudget || 5000;
  const [newBudget, setNewBudget] = useState(String(currentBudget));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await API.get('/expenses');
      setExpenses(response.data);
    } catch (err: any) {
      console.error('Error fetching expenses for budget page:', err);
      showToast('Failed to fetch transaction logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Sync new budget state if user loads later
  useEffect(() => {
    setNewBudget(String(currentBudget));
  }, [currentBudget]);

  // Calculations for current month's expenses
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const currentMonthExpenses = expenses
    .filter((e) => {
      const eDate = new Date(e.date);
      return (
        e.type === 'expense' &&
        eDate.getFullYear() === currentYear &&
        eDate.getMonth() === currentMonth
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const remainingBudget = Math.max(0, currentBudget - currentMonthExpenses);
  const spentPercent = currentBudget > 0 ? (currentMonthExpenses / currentBudget) * 100 : 0;
  const spentPercentFormatted = Math.min(Math.round(spentPercent), 100);

  // Status flags
  const isWarning = spentPercent >= 80 && spentPercent < 100;
  const isExceeded = spentPercent >= 100;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetVal = parseFloat(newBudget);
    if (isNaN(budgetVal) || budgetVal < 0) {
      showToast('Please enter a valid positive budget amount.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await updateBudget(budgetVal);
      showToast('Monthly budget updated successfully!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update budget:', err);
      showToast(err.message || 'Failed to update monthly budget.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Pulse skeleton loader for budgets page
  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="glass-card rounded-2xl p-6">
        <div className="h-6 bg-app-border rounded w-48 mb-4" />
        <div className="h-10 bg-app-border rounded w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-6 h-48 bg-app-border/10" />
        <div className="glass-card rounded-2xl p-6 h-48 bg-app-border/10" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Monthly Budget</h1>
        <p className="text-sm text-app-text-muted mt-1">
          Set guardrails on your spending, monitor notifications, and keep track of your remaining allowance.
        </p>
      </div>

      {loading ? (
        renderSkeleton()
      ) : (
        <>
          {/* Status Banners */}
          {isExceeded && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-500 animate-pulse">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <div>
                <span className="block font-bold">Alert: Budget Limit Exceeded!</span>
                <span className="text-xs text-rose-500/80 font-normal">
                  Your expenses this month (${currentMonthExpenses.toFixed(2)}) have exceeded your set limit of ${currentBudget.toFixed(2)}.
                </span>
              </div>
            </div>
          )}

          {isWarning && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-semibold text-amber-500">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <span className="block font-bold">Warning: Reaching Budget Limit</span>
                <span className="text-xs text-amber-500/80 font-normal">
                  You have spent {spentPercentFormatted}% of your monthly allowance. Keep an eye on your expenses!
                </span>
              </div>
            </div>
          )}

          {/* Budget Limit Setup Card */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 shrink-0">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Active Budget Allocation</h3>
                  <p className="text-xs text-app-text-muted">
                    This limit applies to all outgoing expenses logged for the current calendar month.
                  </p>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveBudget} className="flex gap-2 items-center">
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-app-text-muted">$</span>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="5000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-32 pl-7 pr-3 py-2 text-sm rounded-xl border border-app-border bg-app-card font-bold focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-3.5 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBudget(String(currentBudget));
                      setIsEditing(false);
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-app-border hover:bg-app-bg"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight">${currentBudget.toLocaleString()}</span>
                    <span className="text-xs text-app-text-muted block">Per month</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl border border-app-border bg-app-card px-4 py-2 text-xs font-bold hover:bg-app-bg transition-colors"
                  >
                    Adjust Budget
                  </button>
                </div>
              )}
            </div>

            {/* Progress Visualization */}
            <div className="mt-8 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-app-text-muted">
                <span>Month Progress</span>
                <span>{spentPercentFormatted}% Used</span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-app-bg border border-app-border overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isExceeded
                      ? 'bg-rose-500 shadow-md shadow-rose-500/20'
                      : isWarning
                      ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-emerald-500 shadow-md shadow-emerald-500/20'
                  }`}
                  style={{ width: `${spentPercentFormatted}%` }}
                />
              </div>
            </div>
          </div>

          {/* Remaining Metrics Columns */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Card: Spent So Far */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-app-text-muted uppercase tracking-wider">Spent Current Month</span>
                  <h4 className="text-3xl font-black tracking-tight">${currentMonthExpenses.toFixed(2)}</h4>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-app-text-muted">
                Calculated dynamically across all expense transactions logged between {new Date(currentYear, currentMonth, 1).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} and today.
              </p>
            </div>

            {/* Right Card: Allowance Remaining */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-app-text-muted uppercase tracking-wider">Remaining Allowance</span>
                  <h4 className="text-3xl font-black tracking-tight">${remainingBudget.toFixed(2)}</h4>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-app-text-muted">
                {isExceeded
                  ? 'You have fully consumed your monthly budget. Future expenses will result in cash flow deficit.'
                  : `You have $${remainingBudget.toFixed(2)} available before triggering warning notifications.`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Budgets;
