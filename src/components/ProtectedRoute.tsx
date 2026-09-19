import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is not verified and user is trying to access protected routes other than /verify-email
  if (user && !user.emailVerified && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" replace />;
  }

  // If email is already verified and user is on /verify-email, redirect to dashboard
  if (user && user.emailVerified && location.pathname === '/verify-email') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
