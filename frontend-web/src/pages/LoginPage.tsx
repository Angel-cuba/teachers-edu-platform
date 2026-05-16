import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const inp = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';
const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid email or password';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to EduPlatform</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={lbl}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email" className={inp} />
            </div>

            <div>
              <label className={lbl}>Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  required autoComplete="current-password" className={inp + ' pr-11'} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
