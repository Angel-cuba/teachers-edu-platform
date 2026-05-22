import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isSignedIn, isLoading, user, refreshUser, logout } = useAuth();
  const location = useLocation();
  const refreshTriggeredRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If Clerk says we're signed in but the backend user isn't loaded yet
  // (e.g. a previous fetch failed due to a DB constraint or transient error),
  // trigger a single retry. A 10-second fallback timer calls logout() so the
  // user is never stuck on the spinner forever if the backend is unreachable.
  useEffect(() => {
    if (isSignedIn && !user && !isLoading && !refreshTriggeredRef.current) {
      refreshTriggeredRef.current = true;
      refreshUser();
      fallbackTimerRef.current = setTimeout(logout, 10_000);
    }
    // Cancel the timer as soon as the user loads successfully.
    if (user && fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [isSignedIn, user, isLoading, refreshUser, logout]);

  // Show spinner while loading OR while Clerk session exists but backend user not yet loaded
  if (isLoading || (isSignedIn && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;
