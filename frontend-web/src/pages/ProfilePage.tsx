import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, Lock, Save, Sun, Moon, Monitor, ExternalLink } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import api from '../api/axios'
import { extractErrorMessage } from '../api/errorMessage'
import { useAuth } from '../hooks/useAuth'
import { useTheme, type ThemeMode } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LanguageContext'
import type { Lang } from '../i18n'

export default function ProfilePage() {
  const { user } = useAuth()
  const { openUserProfile } = useClerk()
  const { mode, setMode } = useTheme()
  const { lang, setLang, t } = useLang()

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')

  const updateProfile = useMutation({
    mutationFn: () => api.patch('/users/me', { displayName }),
    onSuccess: () => toast.success(t.profile.profileUpdated),
    onError: (e: unknown) => toast.error(extractErrorMessage(e, t.profile.errorUpdate)),
  })

  const initials = user?.displayName?.charAt(0).toUpperCase() ?? '?'
  const roleLabel: Record<string, string> = {
    TEACHER: t.roles.TEACHER,
    STUDENT: t.roles.STUDENT,
    ADMIN: t.roles.ADMIN,
  }

  const themeOptions: { value: ThemeMode; label: string; Icon: React.ElementType }[] = [
    { value: 'light',  label: t.profile.themeLight,  Icon: Sun },
    { value: 'dark',   label: t.profile.themeDark,   Icon: Moon },
    { value: 'system', label: t.profile.themeSystem, Icon: Monitor },
  ]

  const langOptions: { value: Lang; flag: string; label: string }[] = [
    { value: 'es', flag: '🇪🇸', label: 'Español' },
    { value: 'en', flag: '🇬🇧', label: 'English' },
  ]

  const card = 'bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4'
  const inputCls = 'w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-gray-500'
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.profile.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.profile.subtitle}</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-2xl flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.displayName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <span className="mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-medium">
            {roleLabel[user?.role ?? ''] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Display name */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <User size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t.profile.profileName}</h2>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); updateProfile.mutate() }}
          className="space-y-4"
        >
          <div>
            <label className={labelCls}>{t.profile.visibleName}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              className={inputCls}
              placeholder={t.profile.namePlaceholder}
            />
          </div>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            {updateProfile.isPending ? t.profile.saving : t.profile.saveName}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Sun size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t.profile.appearance}</h2>
        </div>

        {/* Theme */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {themeOptions.find(o => o.value === mode)?.label}
          </p>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mode === value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t.profile.language}</p>
          <div className="flex gap-2">
            {langOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  lang === opt.value
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{opt.flag}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Password — managed by Clerk */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t.profile.changePassword}</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Password and security settings are managed through your Clerk account.
        </p>
        <button
          onClick={() => openUserProfile()}
          className="flex items-center gap-2 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
        >
          <ExternalLink size={15} />
          Manage account & password
        </button>
      </div>
    </div>
  )
}
