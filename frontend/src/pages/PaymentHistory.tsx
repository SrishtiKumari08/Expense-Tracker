import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, Clock, FileDown, QrCode, X, Search, FileSpreadsheet, RefreshCw } from 'lucide-react';

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
  upiId?: string;
}

export const PaymentHistory: React.FC = () => {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states for the list
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Report Generator States
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [weeklyStartDate, setWeeklyStartDate] = useState<string>(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days ago
  );

  // QR Modal States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrLink, setActiveQrLink] = useState('');
  const [activeUpiId, setActiveUpiId] = useState('');
  const [activeAmount, setActiveAmount] = useState<number>(0);

  const fetchExpenses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await API.get('/expenses');
      setExpenses(response.data);
    } catch (err: any) {
      console.error('Error fetching expenses for payment history:', err);
      showToast('Failed to load payment logs.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Inline status toggle handler
  const handleToggleStatus = async (expense: Expense) => {
    const nextStatus = expense.paymentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      await API.put(`/expenses/${expense._id}`, {
        ...expense,
        paymentStatus: nextStatus,
      });
      showToast(`Transaction marked as ${nextStatus}!`, 'success');
      // Update local state directly for speed and responsiveness
      setExpenses((prev) =>
        prev.map((exp) => (exp._id === expense._id ? { ...exp, paymentStatus: nextStatus } : exp))
      );
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleOpenQrModal = (expense: Expense) => {
    if (!expense.upiId) return;
    const link = `upi://pay?pa=${expense.upiId.trim()}&pn=SpendWiseExpense&am=${expense.amount}&cu=INR`;
    setActiveQrLink(link);
    setActiveUpiId(expense.upiId);
    setActiveAmount(expense.amount);
    setQrModalOpen(true);
  };

  // ----------------------------------------------------
  // REPORT DATA CALCULATIONS
  // ----------------------------------------------------
  const filteredReportData = expenses.filter((e) => {
    const d = new Date(e.date);
    if (reportType === 'weekly') {
      const start = new Date(weeklyStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    } else if (reportType === 'monthly') {
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    } else {
      return d.getFullYear() === selectedYear;
    }
  });

  const reportIncome = filteredReportData.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const reportExpenses = filteredReportData.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const reportPaid = filteredReportData.filter((e) => e.paymentStatus === 'Paid').reduce((sum, e) => sum + e.amount, 0);
  const reportPending = filteredReportData.filter((e) => e.paymentStatus === 'Pending').reduce((sum, e) => sum + e.amount, 0);
  const reportNet = reportIncome - reportExpenses;

  // ----------------------------------------------------
  // LIST FILTERING
  // ----------------------------------------------------
  const filteredListExpenses = expenses.filter((e) => {
    if (searchTerm.trim() && !e.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (methodFilter && e.paymentMethod !== methodFilter) return false;
    if (statusFilter && e.paymentStatus !== statusFilter) return false;
    return true;
  });

  // ----------------------------------------------------
  // REPORT EXPORT SCRIPTS
  // ----------------------------------------------------
  const handleExportCSV = () => {
    const filename = `${reportType}_report_${Date.now()}.csv`;
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Payment Method', 'Status', 'Notes', 'UPI ID'];
    const rows = filteredReportData.map((e) => [
      new Date(e.date).toLocaleDateString(),
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.type,
      e.amount,
      e.paymentMethod,
      e.paymentStatus,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      e.upiId || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
    showToast('CSV report downloaded successfully.', 'success');
  };

  const handleExportExcel = () => {
    const filename = `${reportType}_report_${Date.now()}.xls`;
    const headers = ['Date\tDescription\tCategory\tType\tAmount\tPayment Method\tStatus\tNotes\tUPI ID'];
    const rows = filteredReportData.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.description,
      e.category,
      e.type,
      e.amount,
      e.paymentMethod,
      e.paymentStatus,
      e.notes || '',
      e.upiId || '',
    ].join('\t'));

    const excelContent = [headers.join('\t'), ...rows].join('\n');
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
    showToast('Excel report downloaded successfully.', 'success');
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented report print layout.', 'warning');
      return;
    }

    const rowsHtml = filteredReportData
      .map(
        (e) => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString()}</td>
        <td>${e.description}</td>
        <td>${e.category}</td>
        <td>${e.type}</td>
        <td style="text-align: right; font-weight: bold; color: ${e.type === 'income' ? '#10b981' : '#374151'}">${
          e.type === 'income' ? '+' : '-'
        }$${e.amount.toFixed(2)}</td>
        <td>${e.paymentMethod}</td>
        <td style="font-weight: bold; color: ${e.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}">${e.paymentStatus}</td>
      </tr>
    `
      )
      .join('');

    const formattedPeriod =
      reportType === 'weekly'
        ? `Week starting: ${new Date(weeklyStartDate).toLocaleDateString()}`
        : reportType === 'monthly'
        ? `${new Date(selectedYear, selectedMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
        : `Year: ${selectedYear}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportType.toUpperCase()} Financial Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; }
            h1 { margin-bottom: 2px; color: #312e81; font-size: 24px; font-weight: 800; }
            .meta { margin-bottom: 25px; font-size: 11px; color: #9ca3af; text-transform: uppercase; tracking-wider; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; background: #f3f4f6; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
            .summary-card { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
            .summary-val { font-size: 20px; font-weight: 900; color: #111827; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 12px 14px; text-align: left; font-size: 12px; }
            th { background: #f9fafb; font-weight: 700; color: #4b5563; border-top: 1px solid #e5e7eb; text-transform: uppercase; font-size: 10px; tracking-wider; }
            tr:nth-child(even) { background: #f9fafb/50; }
          </style>
        </head>
        <body>
          <h1>SpendWise Report</h1>
          <div class="meta">${reportType} summary • ${formattedPeriod}</div>
          <div class="summary">
            <div class="summary-card">
              <div>Total Income</div>
              <div class="summary-val" style="color: #10b981;">$${reportIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div>Total Expenses</div>
              <div class="summary-val">$${reportExpenses.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div>Net Balance</div>
              <div class="summary-val" style="color: ${reportNet >= 0 ? '#6366f1' : '#ef4444'}">$${reportNet.toFixed(
      2
    )}</div>
            </div>
            <div class="summary-card">
              <div>Settled / Outstanding</div>
              <div class="summary-val" style="font-size: 15px; font-weight: 700; color: #f59e0b;">$${reportPaid.toFixed(
                2
              )} / $${reportPending.toFixed(2)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Report print layout loaded.', 'success');
  };

  // Render skeletons for loaders
  const renderSkeletons = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-app-border">
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-16" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-32" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-20" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-24" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-16" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-app-border rounded w-12" /></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Payment History & Reports</h1>
        <p className="text-sm text-app-text-muted mt-1">
          Verify transactional settlements, generate periodic balance reports, and manage cash vs. digital payments.
        </p>
      </div>

      {/* Report Generator Widget */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-app-border/40 pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight">Financial Reports Engine</h3>
            <p className="text-xs text-app-text-muted mt-0.5">Filter records and compile structural spreadsheet downloads.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-card px-3.5 py-2 text-xs font-bold hover:bg-app-bg transition-colors"
            >
              <FileDown className="h-4 w-4 text-rose-500" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-card px-3.5 py-2 text-xs font-bold hover:bg-app-bg transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-card px-3.5 py-2 text-xs font-bold hover:bg-app-bg transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-blue-500" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters Selectors Row */}
        <div className="flex flex-wrap gap-4 items-end bg-app-bg/30 p-4 rounded-xl border border-app-border/50">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">Duration</label>
            <select
              value={reportType}
              onChange={(e: any) => setReportType(e.target.value)}
              className="px-3.5 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {reportType === 'weekly' && (
            <div className="space-y-1.5">
              <label htmlFor="weekStart" className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">Week Start</label>
              <input
                id="weekStart"
                type="date"
                value={weeklyStartDate}
                onChange={(e) => setWeeklyStartDate(e.target.value)}
                className="px-3.5 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3.5 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleDateString(undefined, { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3.5 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {reportType === 'yearly' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3.5 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Calculations Results Panel */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="border border-app-border bg-app-card p-4 rounded-2xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Income Subtotal</span>
            <div className="text-xl font-black text-emerald-500 mt-1">${reportIncome.toFixed(2)}</div>
          </div>
          <div className="border border-app-border bg-app-card p-4 rounded-2xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Expenses Subtotal</span>
            <div className="text-xl font-black text-app-text mt-1">${reportExpenses.toFixed(2)}</div>
          </div>
          <div className="border border-app-border bg-app-card p-4 rounded-2xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Net Balance</span>
            <div className={`text-xl font-black mt-1 ${reportNet >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>
              ${reportNet.toFixed(2)}
            </div>
          </div>
          <div className="border border-app-border bg-app-card p-4 rounded-2xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Settled vs Outstanding</span>
            <div className="text-xs font-bold text-amber-500 mt-2">
              <span className="text-emerald-500">${reportPaid.toFixed(2)} Paid</span> • <span>${reportPending.toFixed(2)} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters for the Table list */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-app-text-muted" />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-app-border bg-app-card focus:outline-none focus:border-brand-primary"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value="">All Payment Methods</option>
            {['Cash', 'Card', 'UPI', 'Bank Transfer'].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-app-border bg-app-card focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <button
          onClick={() => fetchExpenses(true)}
          title="Reload records"
          className="p-2 rounded-xl border border-app-border bg-app-card hover:bg-app-bg transition-colors"
        >
          <RefreshCw className="h-4.5 w-4.5 text-app-text-muted" />
        </button>
      </div>

      {/* Main Payment History table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-app-border bg-app-bg/50 text-xs font-bold uppercase tracking-wider text-app-text-muted">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Status (Click to toggle)</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">UPI Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border text-sm font-medium">
              {loading ? (
                renderSkeletons()
              ) : filteredListExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-app-text-muted px-6">
                    No payment logs match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredListExpenses.map((expense) => {
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
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-app-text-muted text-xs">
                        {expense.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(expense)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
                            expense.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          }`}
                        >
                          {expense.paymentStatus === 'Paid' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Pending
                            </>
                          )}
                        </button>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-base font-bold ${
                        isIncome ? 'text-emerald-500' : 'text-app-text'
                      }`}>
                        {isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {expense.paymentMethod === 'UPI' && expense.upiId ? (
                          <button
                            onClick={() => handleOpenQrModal(expense)}
                            className="rounded-lg p-1.5 text-brand-primary bg-indigo-500/10 border border-indigo-500/20 hover:bg-brand-primary hover:text-white transition-all"
                            title="Scan QR Code"
                          >
                            <QrCode className="h-4.5 w-4.5" />
                          </button>
                        ) : (
                          <span className="text-app-text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPI QR Popup Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setQrModalOpen(false)}
          />
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative z-10 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-app-border pb-3">
              <h3 className="text-md font-bold tracking-tight">Scan QR to Pay</h3>
              <button 
                onClick={() => setQrModalOpen(false)}
                className="p-1 rounded-lg hover:bg-app-bg text-app-text-muted hover:text-app-text"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQrLink)}`}
                alt="UPI Payment QR"
                className="h-48 w-48 bg-white p-2 rounded-xl shadow-md border"
              />
              <div className="mt-4 space-y-1">
                <span className="text-xs text-app-text-muted block uppercase tracking-wider font-bold">UPI ID</span>
                <span className="text-sm font-semibold text-app-text block font-mono break-all px-4">{activeUpiId}</span>
                <span className="text-xs text-app-text-muted block mt-2">Amount Request</span>
                <span className="text-2xl font-black text-brand-primary block">${activeAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md hover:opacity-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
