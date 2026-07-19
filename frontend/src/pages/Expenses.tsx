import React, { useEffect, useState } from 'react';
import API from '../services/api';
import ExpenseModal from '../components/ExpenseModal';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Search, 
  CheckCircle, 
  Clock, 
  Heart, 
  RefreshCw, 
  Filter, 
  SlidersHorizontal 
} from 'lucide-react';
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
  isFavorite: boolean;
  isRecurring: boolean;
  recurringFrequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const Expenses: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search and Filter States
  const [searchTermDesc, setSearchTermDesc] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [filterType, setFilterType] = useState(''); // 'expense' | 'income' | ''
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterRecurring, setFilterRecurring] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10); // 10 items per page

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Delete Confirmation States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce description search to avoid slamming backend API
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTermDesc);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTermDesc]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, dateFilter, customStartDate, customEndDate, sortBy, filterType, filterFavorite, filterRecurring]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Build API query parameters
      const params: any = {
        page: currentPage,
        limit,
        sortBy,
        type: filterType || undefined,
        category: filterCategory || undefined,
        isFavorite: filterFavorite ? 'true' : undefined,
        isRecurring: filterRecurring ? 'true' : undefined,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // Handle date filters
      if (dateFilter === 'today') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.startDate = start.toISOString();
      } else if (dateFilter === 'week') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        params.startDate = start.toISOString();
      } else if (dateFilter === 'month') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = start.toISOString();
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          params.startDate = new Date(customStartDate).toISOString();
        }
        if (customEndDate) {
          params.endDate = new Date(customEndDate).toISOString();
        }
      }

      const response = await API.get('/expenses', { params });
      
      if (response.data.expenses !== undefined) {
        setExpenses(response.data.expenses);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      } else {
        // Fallback for array response
        setExpenses(response.data);
        setTotalPages(1);
        setTotalItems(response.data.length);
      }
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
  }, [currentPage, debouncedSearch, filterCategory, dateFilter, customStartDate, customEndDate, sortBy, filterType, filterFavorite, filterRecurring]);

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

  const toggleFavorite = async (expense: Expense) => {
    try {
      const nextFavoriteState = !expense.isFavorite;
      await API.put(`/expenses/${expense._id}`, { isFavorite: nextFavoriteState });
      
      // Update local state smoothly
      setExpenses(prev => prev.map(e => e._id === expense._id ? { ...e, isFavorite: nextFavoriteState } : e));
      showToast(nextFavoriteState ? 'Added to favorites!' : 'Removed from favorites.', 'success');
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showToast('Failed to toggle favorite status.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/expenses/${expenseToDelete._id}`);
      showToast('Transaction deleted successfully!', 'success');
      setIsDeleteConfirmOpen(false);
      setExpenseToDelete(null);
      fetchExpenses(); // Refresh the current page log
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      showToast('Failed to delete transaction.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSave = () => {
    fetchExpenses();
  };

  // Categories autocomplete options from user categories
  const categoriesList = Array.from(
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
    ])
  );

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
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-16 mx-auto" /></td>
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
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      {/* Control Panel (Search, Filter, Sort) */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

          {/* Filter by Category */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categoriesList.map((cat) => (
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

          {/* Transaction Type Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Flows</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Picker Inputs & Quick Checkboxes */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-app-border/40">
          
          {/* Custom dates */}
          {dateFilter === 'custom' ? (
            <div className="flex flex-wrap items-center gap-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <label htmlFor="startDate" className="text-xs font-bold text-app-text-muted uppercase">From</label>
                <input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="endDate" className="text-xs font-bold text-app-text-muted uppercase">To</label>
                <input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear range
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-app-text-muted font-medium flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Toggle quick filters to isolate specific ledger entries
            </div>
          )}

          {/* Quick Filters: Favorites and Recurring */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterFavorite(!filterFavorite)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                filterFavorite
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/35 shadow-sm'
                  : 'bg-app-card text-app-text-muted border-app-border hover:bg-app-bg'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${filterFavorite ? 'fill-rose-500 text-rose-500' : 'text-app-text-muted'}`} />
              Favorites Only
            </button>
            <button
              onClick={() => setFilterRecurring(!filterRecurring)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                filterRecurring
                  ? 'bg-indigo-500/10 text-brand-primary border-brand-primary/35 shadow-sm'
                  : 'bg-app-card text-app-text-muted border-app-border hover:bg-app-bg'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Recurring Only
            </button>
          </div>
        </div>
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
                <th className="px-6 py-4 text-center">Fav</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border text-sm font-medium">
              {loading ? (
                renderSkeletons()
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center px-6">
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-app-bg border border-app-border text-app-text-muted shadow-sm">
                        <Filter className="h-7 w-7 text-brand-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold tracking-tight">No Transactions Found</h3>
                        <p className="text-xs text-app-text-muted">
                          We couldn't find any entries matching your filters. Try clearing queries or record a new transaction.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSearchTermDesc('');
                          setFilterCategory('');
                          setDateFilter('all');
                          setFilterType('');
                          setFilterFavorite(false);
                          setFilterRecurring(false);
                        }}
                        className="px-4 py-2 text-xs font-bold rounded-xl border border-app-border hover:bg-app-bg transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
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
                        <div className="flex items-center gap-2">
                          <span>{expense.description}</span>
                          {expense.isRecurring && (
                            <span 
                              title={`Recurring ${expense.recurringFrequency}`} 
                              className="inline-flex items-center justify-center bg-indigo-500/10 rounded-md p-1 hover:bg-indigo-500/20 text-brand-primary transition-all duration-150"
                            >
                              <RefreshCw className="h-3 w-3 animate-spin-slow" />
                            </span>
                          )}
                        </div>
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
                      <td className="px-6 py-4 max-w-[180px] truncate text-app-text-muted text-xs font-normal">
                        {expense.notes || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleFavorite(expense)}
                          className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                          title={expense.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                        >
                          <Heart 
                            className={`h-4.5 w-4.5 transition-all ${
                              expense.isFavorite 
                                ? 'fill-rose-500 text-rose-500' 
                                : 'text-app-text-muted hover:text-rose-500'
                            }`} 
                          />
                        </button>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-base font-extrabold ${
                        isIncome ? 'text-emerald-500' : 'text-app-text'
                      }`}>
                        {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(expense)}
                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-bg hover:text-brand-primary transition-all duration-200 cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(expense)}
                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 cursor-pointer"
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

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-app-card border border-app-border rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-app-text-muted font-medium">
            Showing Page <span className="font-semibold text-app-text">{currentPage}</span> of{' '}
            <span className="font-semibold text-app-text">{totalPages}</span> ({totalItems} records total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-border bg-app-card hover:bg-app-bg text-app-text disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`h-8 w-8 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  currentPage === num
                    ? 'bg-brand-primary text-white font-bold'
                    : 'border border-app-border hover:bg-app-bg text-app-text'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-app-border bg-app-card hover:bg-app-bg text-app-text disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 text-center space-y-4 animate-in fade-in zoom-in-95">
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
                className="flex-1 py-2 text-sm font-semibold rounded-xl border border-app-border hover:bg-app-bg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
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
