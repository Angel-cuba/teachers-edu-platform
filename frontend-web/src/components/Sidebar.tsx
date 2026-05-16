import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Star,
  Bell,
  GraduationCap,
  UserCircle,
  ClipboardCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../contexts/LanguageContext';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { t } = useLang();

  const navItems = [
    {
      to: '/dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: '/courses',
      label: t.nav.courses,
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      to: '/courses/new',
      label: t.nav.createCourse,
      icon: <PlusCircle className="w-5 h-5" />,
      roles: ['TEACHER', 'ADMIN'] as Array<'TEACHER' | 'STUDENT' | 'ADMIN'>,
    },
    {
      to: '/submissions/pending',
      label: 'Pending Grades',
      icon: <ClipboardCheck className="w-5 h-5" />,
      roles: ['TEACHER', 'ADMIN'] as Array<'TEACHER' | 'STUDENT' | 'ADMIN'>,
    },
    {
      to: '/results',
      label: t.nav.results,
      icon: <Star className="w-5 h-5" />,
      roles: ['STUDENT'] as Array<'TEACHER' | 'STUDENT' | 'ADMIN'>,
    },
    {
      to: '/notifications',
      label: t.nav.notifications,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      to: '/profile',
      label: t.nav.profile,
      icon: <UserCircle className="w-5 h-5" />,
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">EduPlatform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-semibold text-sm flex-shrink-0">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
