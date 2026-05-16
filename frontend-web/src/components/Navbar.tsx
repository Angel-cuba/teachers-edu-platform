import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import { useLang } from '../contexts/LanguageContext';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      {/* Right: language + notifications + user */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
          title="Switch language"
          aria-label="Toggle language"
        >
          <span className="text-base leading-none">{lang === 'en' ? '🇬🇧' : '🇪🇸'}</span>
          <span className="uppercase tracking-wide">{lang === 'en' ? 'EN' : 'ES'}</span>
        </button>

        <NotificationBell />

        <div className="flex items-center gap-2 ml-2">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{user?.displayName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.toLowerCase()}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            aria-label={t.common.logout}
            title={t.common.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
