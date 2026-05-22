import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignIn } from '@clerk/clerk-react';
import AuthLayout from '../components/AuthLayout';
import { useLang } from '../contexts/LanguageContext';
import { getClerkErrorMessage } from '../utils/clerkError';
import { generatePassword } from '../utils/passwordUtils';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

const inp =
  'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg ' +
  'bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 ' +
  'placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ' +
  'backdrop-blur-sm';

const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

type Step = 'email' | 'verify';

const ForgotPasswordPage: React.FC = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const { t } = useLang();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: request OTP email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !email) return;
    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      toast.success(t.profile.resetEmailSent);
      setStep('verify');
    } catch (err: unknown) {
      toast.error(getClerkErrorMessage(err, 'Could not send reset code'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: verify OTP + set new password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || !code || !password) return;
    if (password.length < 8) {
      toast.error(t.auth.passwordMinLength);
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success(t.profile.resetSuccess);
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      toast.error(getClerkErrorMessage(err, 'Invalid or expired code'));
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.profile.resetPassword}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">EduPlatform</p>
        </div>

        {/* Glass card */}
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl
                        shadow-xl shadow-black/5 dark:shadow-black/40
                        border border-gray-200/60 dark:border-white/10 p-8">
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSendCode}
                className="space-y-5"
              >
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
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium
                             hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:ring-offset-2 dark:focus:ring-offset-gray-900
                             disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                             flex items-center justify-center gap-2 shadow-md shadow-indigo-500/30"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLoading ? t.common.loading : t.profile.sendCode}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="verify-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleReset}
                className="space-y-5"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.profile.resetEmailSent} <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
                </p>
                <div>
                  <label className={lbl}>{t.profile.resetCode}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t.profile.resetCodePlaceholder}
                    required
                    maxLength={6}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>{t.profile.resetNewPassword}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className={inp + ' pr-20'}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => { const p = generatePassword(); setPassword(p); setShowPassword(true); }}
                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300
                                   transition-colors p-0.5"
                        aria-label="Suggest strong password"
                        title="Suggest strong password"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <PasswordStrengthBar password={password} />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium
                             hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:ring-offset-2 dark:focus:ring-offset-gray-900
                             disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                             flex items-center justify-center gap-2 shadow-md shadow-indigo-500/30"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLoading ? t.common.saving : t.profile.setNewPassword}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setPassword(''); }}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  ← {t.profile.backToPrevStep}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link
              to="/login"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700"
            >
              ← {t.profile.backToLogin}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
