import React, { useEffect, useState } from 'react';
import API from '../services/api';
import ExpenseModal from '../components/ExpenseModal';
import { Pencil, Trash2, Plus, AlertTriangle, Calendar, Search, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface Expense {
  _id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending';
  notes?: string;
}

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search and Filter States
  const [searchTermDesc, setSearchTermDesc] = useState('');
  const [searchTermAmount, setSearchTermAmount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await API.get('/expenses');
      setExpenses(response.data);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      const msg = err.response?.data?.message || 'Failed to load transactions.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleEditClick = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/expenses/${expenseToDelete._id}`);
      setExpenses(expenses.filter((exp) => exp._id !== expenseToDelete._id));
      showToast('Transaction deleted successfully!', 'success');
      setIsDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      showToast('Failed to delete transaction.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Combine default categories and unique custom ones from loaded data and user object
  const uniqueCategories = Array.from(
    new Set([
      'Food',
      'Shopping',
      'Travel',
      'Rent',
      'Entertainment',
      'Bills',
      'Medical',
      'Education',
      'Salary',
      'Others',
      ...(user?.customCategories || []),
      ...expenses.map((e) => e.category),
    ])
  );

  // Filter and Sort implementation
  const filteredAndSortedExpenses = expenses
    .filter((expense) => {
      // 1. Search by Description
      if (searchTermDesc.trim() && !expense.description.toLowerCase().includes(searchTermDesc.toLowerCase())) {
        return false;
      }

      // 2. Search by Amount
      if (searchTermAmount.trim()) {
        const amt = parseFloat(searchTermAmount);
        if (!isNaN(amt) && expense.amount !== amt) {
          return false;
        }
      }

      // 3. Search by Category
      if (filterCategory && expense.category !== filterCategory) {
        return false;
      }

      // 4. Date Filter
      const txDate = new Date(expense.date);
      const now = new Date();

      if (dateFilter === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (txDate < startOfToday) return false;
      } else if (dateFilter === 'week') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Sunday
        if (txDate < startOfWeek) return false;
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (txDate < startOfMonth) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'highest') {
        return b.amount - a.amount;
      }
      if (sortBy === 'lowest') {
        return a.amount - b.amount;
      }
      if (sortBy === 'latest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.description.localeCompare(b.description);
      }
      return 0;
    });

  // Render Skeleton rows for loading state
  const renderSkeletons = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-app-border bg-app-bg/5">
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-16" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-32" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-20" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-24" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-16" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-12" /></td>
          <td className="px-6 py-4 text-right"><div className="h-4 bg-app-border rounded w-16 ml-auto" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-16 mx-auto" /></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Transactions</h1>
          <p className="text-sm text-app-text-muted mt-1">
            Manage your incomes and expenses, update records, and keep track of your cash flow.
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Control Panel (Search, Filter, Sort) */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Search by Description */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-app-text-muted" />
            <input
              type="text"
              placeholder="Search description..."
              value={searchTermDesc}
              onChange={(e) => setSearchTermDesc(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Search by Amount */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-semibold text-app-text-muted">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="Search amount..."
              value={searchTermAmount}
              onChange={(e) => setSearchTermAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Filter by Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Custom Date Picker Inputs */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-app-border/40 animate-fade-in">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-xs font-semibold text-app-text-muted uppercase">From</label>
              <input
                id="startDate"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-xs font-semibold text-app-text-muted uppercase">To</label>
              <input
                id="endDate"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-xs font-semibold text-rose-500 hover:underline"
              >
                Clear range
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-app-border bg-app-bg/50 text-xs font-bold uppercase tracking-wider text-app-text-muted">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border text-sm font-medium">
              {loading ? (
                renderSkeletons()
              ) : filteredAndSortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center space-y-4 px-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-app-bg border border-app-border text-app-text-muted">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold tracking-tight">No Transactions Found</h3>
                      <p className="text-sm text-app-text-muted max-w-sm mx-auto">
                        No transactions match your current search queries or filters. Try adjusting them.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedExpenses.map((expense) => {
                  const isIncome = expense.type === 'income';
                  return (
                    <tr key={expense._id} className="hover:bg-app-bg/25 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-app-text-muted text-xs">
                        {new Date(expense.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-app-text">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            isIncome ? 'bg-emerald-500' : 'bg-brand-primary'
                          }`} />
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-app-text-muted text-xs">
                        {expense.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          expense.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {expense.paymentStatus === 'Paid' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {expense.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-app-text-muted text-xs font-normal">
                        {expense.notes || '—'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-base font-bold ${
                        isIncome ? 'text-emerald-500' : 'text-app-text'
                      }`}>
                        {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(expense)}
                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-bg hover:text-brand-primary transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(expense)}
                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Add/Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchExpenses}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/15">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">Delete Transaction</h3>
              <p className="text-sm text-app-text-muted">
                Are you sure you want to delete this transaction for{' '}
                <span className="font-semibold text-app-text">
                  ${expenseToDelete?.amount.toFixed(2)}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-semibold rounded-xl border border-app-border hover:bg-app-bg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
