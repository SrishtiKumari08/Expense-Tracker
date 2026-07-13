import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrMessage('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrMessage(null);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err: any) {
      setErrMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-app-bg text-app-text md:flex-row md:p-0">
      {/* Decorative background glow blobs */}
      <div className="glow-bg top-[-10%] right-[-10%] opacity-60" />
      <div className="glow-bg bottom-[-10%] left-[-10%] opacity-40" />

      <div className="relative flex w-full max-w-5xl overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl md:grid md:grid-cols-12 md:rounded-3xl">
        {/* Left Section: Branding panel (Desktop only) */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-12 text-white md:col-span-5 md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.15),_transparent_40%)]" />
          
          <div className="z-10 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Wallet className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Spend<span className="text-indigo-400">Wise</span>
            </span>
          </div>

          <div className="z-10 space-y-6">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-indigo-100">
              Join us to master <br />
              your wealth.
            </h2>
            <p className="text-sm text-indigo-200/70 leading-relaxed">
              Create an account and start managing your cash flow. Track spending, set budget guardrails, and build healthy habits.
            </p>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-indigo-200/90 font-medium">Free access, no card details needed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-indigo-200/90 font-medium">Detailed spending insights & analytics</span>
              </div>
            </div>
          </div>

          <div className="z-10 text-xs text-indigo-300/40">
            &copy; 2026 SpendWise Inc. All rights reserved.
          </div>
        </div>

        {/* Right Section: Form container */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 md:col-span-7 lg:px-16">
          <div className="mx-auto w-full max-w-md space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Account</h1>
              <p className="text-sm text-app-text-muted">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-brand-primary hover:underline hover:text-brand-secondary transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Error banner */}
            {errMessage && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-500 flex items-start gap-3 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{errMessage}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name field */}
              <div className="space-y-1">
                <label htmlFor="name" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-app-text-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-app-border bg-app-bg py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-app-text-muted">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-app-border bg-app-bg py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Password (min. 6 chars)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-app-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-app-border bg-app-bg py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-app-text-muted hover:text-app-text"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-app-text-muted uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-app-text-muted">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-app-border bg-app-bg py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              {/* Sign up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Signup;
