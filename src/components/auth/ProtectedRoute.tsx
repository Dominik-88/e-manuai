import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'technik' | 'operator';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, role, isAdmin, isTechnik } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-mono">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/prihlaseni" replace />;
  }

  // Check role requirements
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'technik' && !isAdmin && !isTechnik) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
