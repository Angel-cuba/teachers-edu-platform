import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Mail, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignUp } from '@clerk/clerk-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/AuthLayout';
import { generatePassword } from '../utils/passwordUtils';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';
import { getClerkErrorMessage } from '../utils/clerkError';
import { useLang } from '../contexts/LanguageContext';

const inp =
  'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg ' +
  'bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 ' +
  'placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ' +
  'backdrop-blur-sm';
const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

type Step = 'register' | 'verify';

const RegisterPage: React.FC = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { refreshUser } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  // Registration form state
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'TEACHER' | 'STUDENT',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Email verification state
  const [step, setStep] = useState<Step>('register');
  const [verifyCode, setVerifyCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Step 1: submit registration ───────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!form.displayName || !form.email || !form.password) {
      toast.error(t.common.fieldsRequired); return;
    }
    if (form.password.length < 8) {
      toast.error(t.auth.passwordMinLength); return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t.auth.passwordsMismatch); return;
    }

    setIsLoading(true);
    try {
      const nameParts = form.displayName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName  = nameParts.slice(1).join(' ') || '';

      const result = await signUp.create({
        emailAddress: form.email,
        password: form.password,
        firstName,
        lastName,
      });

      if (result.status === 'complete') {
        // No email verification required (dev mode or disabled in Clerk dashboard)
        await completeSignUp(result.createdSessionId!);
      } else {
        // Email verification required — Clerk will send the code
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
        toast.success(t.auth.checkVerificationEmail);
      }
    } catch (err: unknown) {
      toast.error(getClerkErrorMessage(err, t.auth.registrationFailed));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: verify email code ─────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!verifyCode.trim()) { toast.error(t.auth.enterVerificationCode); return; }

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verifyCode });

      if (result.status === 'complete') {
        await completeSignUp(result.createdSessionId!);
      } else {
        toast.error(t.auth.verificationIncomplete);
      }
    } catch (err: unknown) {
      toast.error(getClerkErrorMessage(err, t.auth.verificationIncomplete));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Finalize: activate session + set role in our backend ─────────────────
  // Ordering matters here to prevent a race condition:
  //   1. setActive()    → Clerk marks session active; AuthContext starts auto-fetch (GET /users/me)
  //   2. PATCH /users/me → commits the chosen role to the DB
  //   3. refreshUser()  → issues a new GET after the PATCH; generation counter in AuthContext
  //                       ensures this last GET wins over the earlier auto-fetch GET
  //   4. navigate()     → user arrives at dashboard with the correct role already in context
  const completeSignUp = async (sessionId: string) => {
    if (!setActive) {
      toast.error(t.auth.authServiceUnavailable);
      return;
    }

    await setActive({ session: sessionId });

    // Always PATCH so the role is committed before we re-fetch
    try {
      await api.patch('/users/me', { role: form.role });
    } catch {
      toast.error(t.auth.roleSetFailed);
      return;
    }

    // Force a fresh GET that reads the committed role — wins over any concurrent
    // auto-fetch triggered by the setActive() call above
    await refreshUser();

    navigate('/dashboard', { replace: true });
    toast.success(t.auth.accountCreated);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {step === 'register' ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -22 }}
            transition={{ duration: 0.35 }}
          >
            {/* Logo */}
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.auth.createAccount}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t.auth.registerSubtitle}</p>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl
                            shadow-xl shadow-black/5 dark:shadow-black/40
                            border border-gray-200/60 dark:border-white/10 p-8">
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className={lbl}>{t.auth.displayName}</label>
                  <input type="text" name="displayName" value={form.displayName}
                    onChange={handleChange} placeholder="Jane Smith" required className={inp} />
                </div>

                <div>
                  <label className={lbl}>{t.auth.email}</label>
                  <input type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="you@example.com"
                    required autoComplete="email" className={inp} />
                </div>

                <div>
                  <label className={lbl}>{t.auth.iAmA}</label>
                  <select name="role" value={form.role} onChange={handleChange} className={inp}>
                    <option value="STUDENT">{t.auth.student}</option>
                    <option value="TEACHER">{t.auth.teacher}</option>
                  </select>
                </div>

                <div>
                  <label className={lbl}>{t.auth.password}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange}
                      placeholder={t.auth.passwordPlaceholder} required autoComplete="new-password"
                      className={inp + ' pr-20'} />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => {
                          const p = generatePassword();
                          setForm(prev => ({ ...prev, password: p, confirmPassword: p }));
                          setShowPassword(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors p-0.5"
                        aria-label="Suggest strong password"
                        title="Suggest strong password"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPassword(v => !v)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <PasswordStrengthBar password={form.password} />
                </div>

                <div>
                  <label className={lbl}>{t.auth.confirmPasswordLabel}</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="••••••••" required autoComplete="new-password"
                      className={inp + ' pr-11'} />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading || !isLoaded}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium
                             hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:ring-offset-2 dark:focus:ring-offset-gray-900
                             disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                             flex items-center justify-center gap-2">
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLoading ? t.auth.creatingAccount : t.auth.registerBtn}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {t.auth.hasAccount}{' '}
                <Link to="/login"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700">
                  {t.auth.loginBtn}
                </Link>
              </p>
            </div>
          </motion.div>
        ) : (
          // ── Email verification step ───────────────────────────────────────
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -22 }}
            transition={{ duration: 0.35 }}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4
                           shadow-lg shadow-indigo-500/40"
              >
                <Mail className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.auth.checkYourEmail}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t.auth.weSentCodeTo} <strong className="text-gray-700 dark:text-gray-200">{form.email}</strong>
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl
                            shadow-xl shadow-black/5 dark:shadow-black/40
                            border border-gray-200/60 dark:border-white/10 p-8">
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className={lbl}>{t.auth.verificationCodeLabel}</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value)}
                    placeholder={t.auth.codePlaceholder}
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                    className={inp + ' text-center text-lg tracking-[0.4em] font-mono'}
                  />
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium
                             hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:ring-offset-2 dark:focus:ring-offset-gray-900
                             disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                             flex items-center justify-center gap-2
                             shadow-md shadow-indigo-500/30">
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isLoading ? t.auth.verifying : t.auth.verifyEmailBtn}
                </button>
              </form>

              <button
                onClick={() => setStep('register')}
                className="mt-4 w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t.auth.backToRegistration}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default RegisterPage;
