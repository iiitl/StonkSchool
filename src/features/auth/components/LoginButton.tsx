'use client';

import React, { useState, useCallback } from 'react';
import { getGoogleLoginUrl } from '../api';

interface LoginButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function LoginButton({ className = '', variant = 'primary' }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = await getGoogleLoginUrl();
      
      // Validate URL before redirecting (security check)
      if (!url.startsWith('https://accounts.google.com/')) {
        throw new Error('Invalid OAuth URL');
      }
      
      // Redirect to Google OAuth
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start login');
      setIsLoading(false);
    }
  }, []);

  const baseStyles = `
    inline-flex items-center justify-center gap-2 
    px-4 py-2.5 rounded-lg font-medium 
    transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: `
      bg-white text-gray-800 
      hover:bg-gray-100 
      border border-gray-300
      shadow-sm
    `,
    secondary: `
      bg-transparent text-white 
      hover:bg-white/10 
      border border-white/30
    `,
  };

  return (
    <div className="relative">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        aria-label="Sign in with Google"
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
      </button>
      
      {error && (
        <div role="alert" className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
