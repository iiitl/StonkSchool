'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * Protects routes from unauthenticated access
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      // Store the current path to redirect back after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect', window.location.pathname);
      }
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return fallback || <LoadingFallback />;
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return fallback || <LoadingFallback />;
  }

  return <>{children}</>;
}

/**
 * Default loading fallback
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Checking authentication...</p>
      </div>
    </div>
  );
}
