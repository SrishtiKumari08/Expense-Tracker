import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrMessage(null);

    // Mocking an API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err: any) {
      setErrMessage('Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-app-bg text-app-text">
      {/* Glow shapes */}
      <div className="glow-bg top-[20%] left-[20%] opacity-50" />

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-app-border bg-app-card p-8 shadow-2xl z-10">
        {!isSubmitted ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
              <p className="text-sm text-app-text-muted">
                Enter your email address and we'll send you link instructions to reset your password.
              </p>
            </div>

            {/* Error prompt */}
            {errMessage && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
                {errMessage}
              </div>
            )}

            {/* Input field */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
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

              {/* Submit trigger */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Send Reset Link
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success display */
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Check your Email</h2>
              <p className="text-sm text-app-text-muted">
                We have sent password recovery instructions to <span className="font-semibold text-app-text">{email}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Footer Back navigation */}
        <div className="mt-6 border-t border-app-border pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:underline hover:text-brand-secondary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
