import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children?: React.ReactNode;
}

/**
 * Redirects signed-in users away from public pages (e.g. /login, /register).
 *
 * We check `isSignedIn` (Clerk session exists) rather than `isAuthenticated`
 * (Clerk session + backend user) so that users whose backend user fetch previously
 * failed (e.g. due to a DB constraint) still get redirected to /dashboard instead
 * of seeing the login form — ProtectedRoute will retry the fetch there.
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated || isSignedIn) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default PublicRoute;
