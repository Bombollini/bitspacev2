
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authStore';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('MEMBER');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup, user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && user) {
      console.log('LoginPage: User already authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isLogin) {
        console.log('LoginPage: Attempting login...');
        const start = performance.now();
        await login({ email, password });
        const end = performance.now();
        console.log(`LoginPage: Login completed in ${(end - start).toFixed(2)}ms`);
        navigate('/dashboard');
      } else {
        await signup({ email, password, name, role });
        // After signup, switch to login view and show success message
        setIsLogin(true);
        setError(null); // Clear errors
        alert('Account created! Please sign in with your new account.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Show the actual error message
      setError(err.message || err.response?.data?.message || 'Authentication failed. Please check connection and credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
            <img src="/logo.png" alt="Bitspace Logo" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-[0_0_15px_rgba(0,243,255,0.4)] animate-pulse-glow" />
            <h1 className="text-3xl font-bold text-white tracking-tight font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-400 mt-2">
                {isLogin ? 'Sign in to your Bitspace account' : 'Join Bitspace to manage your projects'}
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
            
            {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-300">Password</label>
                {isLogin && <a href="#" className="text-xs text-neon-blue hover:text-white transition-colors">Forgot?</a>}
              </div>
              <input 
                type="password"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Role</label>
                  <select 
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white transition-all [&>option]:bg-slate-900"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="MEMBER">Member (Standard Access)</option>
                    <option value="ADMIN">Admin (Manage Content)</option>
                    <option value="OWNER">Owner (Full Control)</option>
                  </select>
                </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neon-blue hover:bg-white text-black font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group duration-300"
            >
              {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Initialize Account')}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an access ID? " : "Already have an account? "}
            <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-neon-blue font-bold hover:text-white transition-colors hover:underline"
            >
                {isLogin ? 'Sign Up' : 'Log In'}
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
