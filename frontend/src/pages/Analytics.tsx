import React, { useEffect, useState, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Chart from 'chart.js/auto';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, PieChart, Info } from 'lucide-react';

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

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Canvas Refs for Charts
  const pieCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chart instances for cleanup
  const pieChartInst = useRef<Chart | null>(null);
  const barChartInst = useRef<Chart | null>(null);
  const lineChartInst = useRef<Chart | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await API.get('/expenses');
      setExpenses(response.data);
    } catch (err: any) {
      console.error('Error fetching expenses on analytics page:', err);
      showToast('Failed to sync transaction archives.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Time groupings calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Summary Metrics
  const currentMonthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return e.type === 'expense' && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const currentMonthIncome = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return e.type === 'income' && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const currentMonthSavings = currentMonthIncome - currentMonthExpenses;
  const currentBudget = user?.monthlyBudget || 5000;
  const remainingBudget = Math.max(0, currentBudget - currentMonthExpenses);

  // Calculate past 6 months buckets
  const last6Months: Array<{ year: number; month: number; label: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    last6Months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    });
  }

  // Draw Charts
  useEffect(() => {
    if (loading || expenses.length === 0) return;

    // Destructure theme variables for chart rendering
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    const labelColor = isDark ? '#94a3b8' : '#64748b';

    // 1. PIE CHART: Category Breakdown for Current Month
    if (pieCanvasRef.current) {
      if (pieChartInst.current) pieChartInst.current.destroy();

      const categoriesMap: { [key: string]: number } = {};
      expenses
        .filter((e) => {
          const d = new Date(e.date);
          return e.type === 'expense' && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .forEach((e) => {
          categoriesMap[e.category] = (categoriesMap[e.category] || 0) + e.amount;
        });

      const pieLabels = Object.keys(categoriesMap);
      const pieData = Object.values(categoriesMap);

      if (pieData.length > 0) {
        pieChartInst.current = new Chart(pieCanvasRef.current, {
          type: 'doughnut',
          data: {
            labels: pieLabels,
            datasets: [
              {
                data: pieData,
                backgroundColor: [
                  '#6366f1', // Indigo
                  '#0ea5e9', // Sky
                  '#f43f5e', // Rose
                  '#f59e0b', // Amber
                  '#10b981', // Emerald
                  '#8b5cf6', // Violet
                  '#ec4899', // Pink
                  '#14b8a6', // Teal
                  '#94a3b8', // Slate
                ],
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#0f172a' : '#ffffff',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: labelColor,
                  font: { family: 'Inter', size: 11, weight: 'bold' },
                  padding: 15,
                },
              },
            },
          },
        });
      }
    }

    // 2. BAR CHART: Monthly Expenses (Past 6 Months)
    if (barCanvasRef.current) {
      if (barChartInst.current) barChartInst.current.destroy();

      const barData = last6Months.map((m) => {
        return expenses
          .filter((e) => {
            const d = new Date(e.date);
            return e.type === 'expense' && d.getFullYear() === m.year && d.getMonth() === m.month;
          })
          .reduce((sum, e) => sum + e.amount, 0);
      });

      barChartInst.current = new Chart(barCanvasRef.current, {
        type: 'bar',
        data: {
          labels: last6Months.map((m) => m.label),
          datasets: [
            {
              label: 'Expenses',
              data: barData,
              backgroundColor: 'rgba(99, 102, 241, 0.85)',
              hoverBackgroundColor: '#6366f1',
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: labelColor, font: { family: 'Inter', size: 10, weight: 'bold' } },
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: labelColor, font: { family: 'Inter', size: 10 } },
              border: { dash: [4, 4] },
            },
          },
        },
      });
    }

    // 3. LINE CHART: Income vs Expenses curves (Past 6 Months)
    if (lineCanvasRef.current) {
      if (lineChartInst.current) lineChartInst.current.destroy();

      const incomeLineData = last6Months.map((m) => {
        return expenses
          .filter((e) => {
            const d = new Date(e.date);
            return e.type === 'income' && d.getFullYear() === m.year && d.getMonth() === m.month;
          })
          .reduce((sum, e) => sum + e.amount, 0);
      });

      const expenseLineData = last6Months.map((m) => {
        return expenses
          .filter((e) => {
            const d = new Date(e.date);
            return e.type === 'expense' && d.getFullYear() === m.year && d.getMonth() === m.month;
          })
          .reduce((sum, e) => sum + e.amount, 0);
      });

      lineChartInst.current = new Chart(lineCanvasRef.current, {
        type: 'line',
        data: {
          labels: last6Months.map((m) => m.label),
          datasets: [
            {
              label: 'Income',
              data: incomeLineData,
              borderColor: '#10b981', // Emerald
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              tension: 0.35,
              fill: true,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#10b981',
            },
            {
              label: 'Expenses',
              data: expenseLineData,
              borderColor: '#6366f1', // Indigo
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              tension: 0.35,
              fill: true,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#6366f1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: labelColor,
                font: { family: 'Inter', size: 10, weight: 'bold' },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: labelColor, font: { family: 'Inter', size: 10, weight: 'bold' } },
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: labelColor, font: { family: 'Inter', size: 10 } },
              border: { dash: [4, 4] },
            },
          },
        },
      });
    }

    // Clean up instances on unmount
    return () => {
      if (pieChartInst.current) pieChartInst.current.destroy();
      if (barChartInst.current) barChartInst.current.destroy();
      if (lineChartInst.current) lineChartInst.current.destroy();
    };
  }, [loading, expenses]);

  // Check if current month has any expenses logged
  const hasExpensesThisMonth = expenses.some((e) => {
    const d = new Date(e.date);
    return e.type === 'expense' && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Skeletal loader layout
  const renderSkeletons = () => (
    <div className="space-y-6 animate-pulse">
      {/* Metric Cards Skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-app-border rounded w-20" />
              <div className="h-9 w-9 rounded-xl bg-app-border" />
            </div>
            <div className="h-8 bg-app-border rounded w-28" />
          </div>
        ))}
      </div>

      {/* Charts row skeleton */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="glass-card rounded-2xl p-6 lg:col-span-4 h-96 bg-app-border/10" />
        <div className="glass-card rounded-2xl p-6 lg:col-span-8 h-96 bg-app-border/10" />
      </div>
    </div>
  );

  const metrics = [
    {
      title: 'Month Income',
      amount: `$${currentMonthIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-500/20',
    },
    {
      title: 'Month Expenses',
      amount: `$${currentMonthExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-500/20',
    },
    {
      title: 'Month Net Savings',
      amount: `$${currentMonthSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: currentMonthSavings >= 0 
        ? 'from-blue-500/10 to-indigo-500/10 text-indigo-500 border-indigo-500/20' 
        : 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-500/20',
    },
    {
      title: 'Remaining Budget',
      amount: `$${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: Calendar,
      color: remainingBudget > 0 
        ? 'from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-500/20' 
        : 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics & Reports</h1>
        <p className="text-sm text-app-text-muted mt-1">
          Review dynamic visuals of your category distributions, savings curves, and cash flow trends.
        </p>
      </div>

      {loading ? (
        renderSkeletons()
      ) : expenses.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center space-y-4 px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-app-bg border border-app-border text-app-text-muted">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight">No Reports Available</h3>
            <p className="text-sm text-app-text-muted max-w-sm mx-auto">
              Please log transactions on the Expenses page first to unlock interactive charts and reports.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Monthly Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.title} className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.01] transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-app-text-muted uppercase tracking-wider">{metric.title}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-gradient-to-tr ${metric.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-black tracking-tight">{metric.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Visuals Grid */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Pie Chart Widget: Category Distribution */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-4 flex flex-col justify-between h-[420px]">
              <div>
                <h3 className="text-base font-bold tracking-tight mb-1 flex items-center gap-1.5">
                  <PieChart className="h-4 w-4 text-brand-primary" />
                  Category Breakdown
                </h3>
                <p className="text-xs text-app-text-muted">
                  distribution of expenses for the current month.
                </p>
              </div>
              <div className="relative flex-1 flex items-center justify-center mt-4 max-h-[280px]">
                {hasExpensesThisMonth ? (
                  <canvas ref={pieCanvasRef} />
                ) : (
                  <div className="flex flex-col items-center text-center p-4 text-app-text-muted">
                    <Info className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs font-medium">No expenses logged this month.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Chart Widget: Income vs Expenses Curves */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-8 flex flex-col justify-between h-[420px]">
              <div>
                <h3 className="text-base font-bold tracking-tight mb-1 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-brand-secondary" />
                  Income vs Expenses Trend
                </h3>
                <p className="text-xs text-app-text-muted">
                  Monthly cash flow comparison curve over the past 6 months.
                </p>
              </div>
              <div className="relative flex-1 mt-4 max-h-[300px]">
                <canvas ref={lineCanvasRef} />
              </div>
            </div>
          </div>

          {/* Bottom Grid: Monthly bar chart */}
          <div className="glass-card rounded-2xl p-6 h-[380px] flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold tracking-tight mb-1 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-brand-primary" />
                Monthly Spending Comparison
              </h3>
              <p className="text-xs text-app-text-muted">
                Expense bar aggregates evaluated over the past 6 calendar months.
              </p>
            </div>
            <div className="relative flex-1 mt-4 max-h-[260px]">
              <canvas ref={barCanvasRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
