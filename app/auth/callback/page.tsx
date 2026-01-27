'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already authenticated, redirect
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem('auth_redirect') || '/cfd';
      sessionStorage.removeItem('auth_redirect');
      router.push(redirectPath);
      return;
    }

    async function handleCallback() {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      // Handle OAuth errors from Google
      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`);
        return;
      }

      // Validate authorization code exists
      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        await login(code);
        
        // Redirect to original destination or default
        const redirectPath = sessionStorage.getItem('auth_redirect') || '/cfd';
        sessionStorage.removeItem('auth_redirect');
        router.push(redirectPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    handleCallback();
  }, [searchParams, login, router, isAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Authentication Failed</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Signing you in...</h1>
          <p className="text-white/60">Please wait while we complete authentication</p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
