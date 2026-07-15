import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authStore';

export const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePassword, cancelRecovery, isRecoveringPassword, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're not in recovery mode and not loading
    if (!isLoading && !isRecoveringPassword && !user) {
      console.log("ResetPasswordPage: Not in recovery mode and no user, redirecting to login...");
      // Give a small delay to show the error message first
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [isRecoveringPassword, isLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Attempting to update password...");
      await updatePassword(newPassword);
      console.log("Password updated successfully!");
      setSuccessMsg('Password updated successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      // Check for specific error messages
      if (err.message?.includes('session')) {
        errorMessage = 'Auth session missing! Please request a new password reset link.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if not in recovery mode
  if (!isRecoveringPassword && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-10">
            <img src="/logo.png" alt="Bitspace Logo" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-[0_0_15px_rgba(0,243,255,0.4)] animate-pulse-glow" />
            <h1 className="text-3xl font-bold text-white tracking-tight font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              Invalid Reset Link
            </h1>
            <p className="text-slate-400 mt-2">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/10 text-center">
            <p className="text-rose-400 mb-6">
              Redirecting to login page...
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/login')} 
              className="w-full bg-neon-blue hover:bg-white text-black font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all active:scale-[0.98] group duration-300"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Bitspace Logo" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-[0_0_15px_rgba(0,243,255,0.4)] animate-pulse-glow" />
          <h1 className="text-3xl font-bold text-white tracking-tight font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Reset Your Password
          </h1>
          <p className="text-slate-400 mt-2">
            Enter your new password below
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">New Password</label>
              <input 
                type="password"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
              <input 
                type="password"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neon-blue hover:bg-white text-black font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group duration-300"
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-slate-400">
            <button 
              type="button" 
              onClick={() => {
                cancelRecovery();
                navigate('/login');
              }} 
              className="text-neon-blue font-bold hover:text-white transition-colors hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-8">
          &copy; 2026 Bitspace Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
};
