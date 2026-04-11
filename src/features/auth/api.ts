// Auth API Service - Secure communication with auth backend
// Designed for httpOnly cookie authentication

import { AuthResponse, GoogleLoginUrlResponse, User } from './types';
import { devLog } from "../../utils/logger";
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 10000; // 10 second timeout for security

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * Fetch wrapper with timeout and error handling
 */
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${AUTH_API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      credentials: 'include', // Always include cookies for httpOnly support
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new AuthApiError(
        error.error || `Request failed with status ${response.status}`,
        response.status,
        error.code
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof AuthApiError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AuthApiError('Request timed out', 408, 'TIMEOUT');
    }
    
    throw new AuthApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Get Google OAuth login URL from backend
 */
export async function getGoogleLoginUrl(): Promise<string> {
  const response = await authFetch<GoogleLoginUrlResponse>('/auth/google/login');
  return response.url;
}

/**
 * Exchange OAuth authorization code for JWT token
 * The backend will set an httpOnly cookie with the token
 * Also returns token in response body for backward compatibility
 */
export async function exchangeCodeForToken(code: string): Promise<AuthResponse> {
  // Validate code format before sending (basic security check)
  if (!code || typeof code !== 'string' || code.length < 10) {
    throw new AuthApiError('Invalid authorization code', 400, 'INVALID_CODE');
  }

  const response = await authFetch<AuthResponse>(
    `/auth/google/callback?code=${encodeURIComponent(code)}`
  );
  
  return response;
}

/**
 * Get current authenticated user
 * First tries httpOnly cookie auth, falls back to token header
 */
export async function getCurrentUser(token?: string): Promise<User> {
  const headers: Record<string, string> = {};
  
  // If token provided, use it in header (fallback for non-cookie auth)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return authFetch<User>('/auth/me', { headers });
}

/**
 * Logout - clears session on backend (clears httpOnly cookie)
 * Falls back to client-side cleanup if backend doesn't support logout endpoint
 */
export async function logout(): Promise<void> {
  try {
    await authFetch<void>('/auth/logout', { method: 'POST' });
  } catch (error) {
    // Logout endpoint may not exist, that's okay
    // Client-side cleanup will handle it
    devLog("message", error);

  }
}

export { AuthApiError };
