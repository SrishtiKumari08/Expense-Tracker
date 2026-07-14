import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  expenseToEdit?: any;
}

const DEFAULT_CATEGORIES = [
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
];

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
}) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [notes, setNotes] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize values when modal opens or expenseToEdit changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (expenseToEdit) {
        setType(expenseToEdit.type || 'expense');
        setAmount(String(expenseToEdit.amount));
        setDescription(expenseToEdit.description);
        
        const isCustom = !DEFAULT_CATEGORIES.includes(expenseToEdit.category);
        if (isCustom) {
          setIsCustomCategory(true);
          setCustomCategory(expenseToEdit.category);
          setCategory('Custom...');
        } else {
          setIsCustomCategory(false);
          setCustomCategory('');
          setCategory(expenseToEdit.category);
        }

        // Format ISO Date to YYYY-MM-DD
        const formattedDate = expenseToEdit.date
          ? new Date(expenseToEdit.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        setDate(formattedDate);
        setPaymentMethod(expenseToEdit.paymentMethod || 'Cash');
        setPaymentStatus(expenseToEdit.paymentStatus || 'Paid');
        setNotes(expenseToEdit.notes || '');
        setUpiId(expenseToEdit.upiId || '');
      } else {
        // Reset to defaults
        setType('expense');
        setAmount('');
        setIsCustomCategory(false);
        setCustomCategory('');
        setCategory(DEFAULT_CATEGORIES[0]);
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setPaymentStatus('Paid');
        setNotes('');
        setUpiId('');
      }
    }
  }, [isOpen, expenseToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Please provide a category.');
      return;
    }

    if (paymentMethod === 'UPI') {
      if (!upiId.trim()) {
        setError('Please enter a recipient UPI ID.');
        return;
      }
      if (!/^[\w.\-_]+@[\w.\-_]+$/.test(upiId.trim())) {
        setError('Please enter a valid UPI ID format (e.g., recipient@bank).');
        return;
      }
    }

    setLoading(true);

    const payload = {
      type,
      amount: parsedAmount,
      category: finalCategory,
      description: description.trim(),
      date: new Date(date),
      paymentMethod,
      paymentStatus,
      notes: notes.trim() || undefined,
      upiId: paymentMethod === 'UPI' ? upiId.trim() : undefined,
    };

    try {
      if (expenseToEdit) {
        // Edit mode
        await API.put(`/expenses/${expenseToEdit._id}`, payload);
        showToast('Transaction updated successfully!', 'success');
      } else {
        // Add mode
        await API.post('/expenses', payload);
        showToast('Transaction added successfully!', 'success');
      }
      await refreshUser();
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      const msg = err.response?.data?.message || 'Failed to save transaction. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Combine default categories and user custom categories
  const categoriesList = [
    ...DEFAULT_CATEGORIES,
    ...(user?.customCategories || []).filter((c) => !DEFAULT_CATEGORIES.includes(c)),
    'Custom...',
  ];

  const isValidUpi = /^[\w.\-_]+@[\w.\-_]+$/.test(upiId.trim());
  const cleanAmount = parseFloat(amount);
  const upiLink = upiId.trim() && isValidUpi
    ? `upi://pay?pa=${upiId.trim()}&pn=SpendWise&cu=INR${!isNaN(cleanAmount) && cleanAmount > 0 ? `&am=${cleanAmount}` : ''}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 overflow-hidden transform scale-100 transition-transform max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-app-border pb-4 mb-4">
          <h3 className="text-lg font-bold tracking-tight">
            {expenseToEdit ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-bg hover:text-app-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-500 border border-rose-500/15 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Type Toggle Tab */}
          <div>
            <label className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-app-bg border border-app-border">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-app-card text-brand-accent shadow-sm border border-app-border'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-app-card text-emerald-500 shadow-sm border border-app-border'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Amount ($)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label htmlFor="category" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  if (val === 'Custom...') {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                  }
                }}
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                required
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Category Input */}
          {isCustomCategory && (
            <div className="animate-fade-in">
              <label htmlFor="customCategory" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Custom Category Name
              </label>
              <input
                id="customCategory"
                type="text"
                placeholder="e.g. Subscriptions, Hobbies"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>
          )}

          {/* UPI ID Input & QR Code Generation */}
          {paymentMethod === 'UPI' && (
            <div className="space-y-3 animate-fade-in border-t border-app-border/40 pt-3">
              <div>
                <label htmlFor="upiId" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                  Recipient UPI ID
                </label>
                <input
                  id="upiId"
                  type="text"
                  placeholder="e.g. name@upi, name@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                  required={paymentMethod === 'UPI'}
                />
                {upiId.trim() && !isValidUpi && (
                  <p className="text-[10px] text-amber-500 font-semibold mt-1">
                    ⚠️ Invalid VPA format. Must be like user@bankname.
                  </p>
                )}
              </div>
              {upiId.trim() && isValidUpi && (
                <div className="flex flex-col items-center justify-center p-4 border border-app-border bg-app-bg/40 rounded-2xl relative overflow-hidden space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-app-text-muted">Scan QR to Complete Payment</span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`}
                    alt="UPI payment QR Code"
                    className="h-36 w-36 bg-white p-1.5 rounded-xl shadow-md border border-app-border transition-transform hover:scale-105"
                  />
                  <div className="text-center space-y-0.5">
                    <span className="text-xs font-semibold text-app-text block">Recipient: SpendWise</span>
                    <span className="text-[10px] text-app-text-muted block font-mono break-all">{upiId.trim()}</span>
                  </div>
                  <p className="text-[10px] text-app-text-muted text-center max-w-xs leading-relaxed border-t border-app-border/40 pt-2 font-normal">
                    Note: Ensure this UPI ID is linked to an active bank account. If your mobile app says "add bank account", link a bank account inside your UPI application.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="description" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g. AWS Subscription, Grocery Store"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>

          {/* Payment Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Paid')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-app-card text-app-text-muted border-app-border hover:bg-app-bg'
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pending')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                    paymentStatus === 'Pending'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-app-card text-app-text-muted border-app-border hover:bg-app-bg'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block mb-1.5">
                Notes (Optional)
              </label>
              <input
                id="notes"
                type="text"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end border-t border-app-border pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-app-border hover:bg-app-bg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-95 transition-opacity disabled:opacity-50 min-w-[100px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : expenseToEdit ? (
                'Save Changes'
              ) : (
                'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
