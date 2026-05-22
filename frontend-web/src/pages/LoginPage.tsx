import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { getClerkErrorMessage } from '../utils/clerkError';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useSignIn } from '@clerk/clerk-react';
import AuthLayout from '../components/AuthLayout';

const inp =
  'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg ' +
  'bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 ' +
  'placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ' +
  'backdrop-blur-sm';

const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const LoginPage: React.FC = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!email || !password) { toast.error(t.common.fieldsRequired); return; }

    setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate(from, { replace: true });
      } else {
        // Unexpected status (e.g. MFA required) — not handled in this phase
        toast.error('Sign-in incomplete. Please try again.');
      }
    } catch (err: unknown) {
      toast.error(getClerkErrorMessage(err, 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4
                       shadow-lg shadow-indigo-500/40"
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.auth.welcomeBack}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.auth.loginSubtitle}</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl
                        shadow-xl shadow-black/5 dark:shadow-black/40
                        border border-gray-200/60 dark:border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={lbl}>{t.auth.email}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inp}
              />
            </div>

            <div>
              <label className={lbl}>{t.auth.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={inp + ' pr-11'}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                {t.profile.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium
                         hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                         focus:ring-offset-2 dark:focus:ring-offset-gray-900
                         disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                         flex items-center justify-center gap-2
                         shadow-md shadow-indigo-500/30"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? t.common.loading : t.auth.loginBtn}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t.auth.noAccount}{' '}
            <Link
              to="/register"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700"
            >
              {t.auth.registerBtn}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
