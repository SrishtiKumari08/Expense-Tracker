import React, { useEffect, useState } from 'react';
import API from '../services/api';
import ExpenseModal from '../components/ExpenseModal';
import { Pencil, Trash2, Plus, AlertTriangle, Calendar, Tag, CreditCard, CheckCircle, Clock } from 'lucide-react';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.response?.data?.message || 'Failed to load expenses.');
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
      setIsDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

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

      {error && (
        <div className="rounded-xl bg-rose-500/10 p-4 text-sm font-medium text-rose-500 border border-rose-500/15">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
            <p className="text-sm text-app-text-muted font-medium">Fetching transaction history...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-app-bg border border-app-border text-app-text-muted">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">No Transactions Logged</h3>
              <p className="text-sm text-app-text-muted max-w-sm">
                Get started by clicking the "Add Transaction" button above to record your first income or expense.
              </p>
            </div>
          </div>
        ) : (
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
                {expenses.map((expense) => {
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
                })}
              </tbody>
            </table>
          </div>
        )}
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
