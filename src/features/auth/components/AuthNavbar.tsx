'use client';

import { useAuth } from '../AuthContext';
import { LoginButton } from './LoginButton';
import { UserMenu } from './UserMenu';

interface AuthNavbarProps {
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * Auth buttons for navbar - shows login or user menu based on auth state
 */
export function AuthNavbar({ variant = 'dark', className = '' }: AuthNavbarProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`w-8 h-8 rounded-full bg-white/10 animate-pulse ${className}`} />
    );
  }

  if (isAuthenticated) {
    return <UserMenu className={className} />;
  }

  return (
    <LoginButton
      variant={variant === 'dark' ? 'secondary' : 'primary'}
      className={className}
    />
  );
}
