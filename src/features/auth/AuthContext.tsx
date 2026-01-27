'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { AuthState, AuthAction, User } from './types';
import { getCurrentUser, logout as apiLogout, exchangeCodeForToken } from './api';

// Token storage key for sessionStorage (not localStorage for security)
const TOKEN_STORAGE_KEY = 'stonk_auth_token';

// Whether to persist token in sessionStorage (clears on browser close)
// Set to false for maximum security (token only in memory)
const PERSIST_IN_SESSION = true;

interface AuthContextType extends AuthState {
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check for existing session
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory token storage (never persisted unless PERSIST_IN_SESSION is true)
let memoryToken: string | null = null;

/**
 * Get stored token from memory or sessionStorage
 */
function getStoredToken(): string | null {
  if (memoryToken) return memoryToken;
  
  if (PERSIST_IN_SESSION && typeof window !== 'undefined') {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }
  
  return null;
}

/**
 * Store token in memory and optionally sessionStorage
 */
function storeToken(token: string): void {
  memoryToken = token;
  
  if (PERSIST_IN_SESSION && typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

/**
 * Clear stored token
 */
function clearToken(): void {
  memoryToken = null;
  
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Check for existing session on mount
   * Tries httpOnly cookie first, then falls back to stored token
   */
  useEffect(() => {
    async function checkAuthState() {
      try {
        const token = getStoredToken();
        
        // Try to get current user (httpOnly cookie will be sent automatically)
        const user = await getCurrentUser(token || undefined);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: token || '' },
        });
      } catch {
        // No valid session, clear any stale tokens
        clearToken();
        dispatch({ type: 'LOGOUT' });
      }
    }

    checkAuthState();
  }, []);

  /**
   * Login with OAuth authorization code
   */
  const login = useCallback(async (code: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await exchangeCodeForToken(code);
      
      // Store token for fallback auth (httpOnly cookie is primary)
      if (response.access_token) {
        storeToken(response.access_token);
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.access_token },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  /**
   * Logout and clear all auth state
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout(); // Clear httpOnly cookie on server
    } catch {
      // Continue with client-side cleanup even if server logout fails
    }
    
    clearToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  /**
   * Refresh current user data
   */
  const refreshUser = useCallback(async () => {
    try {
      const token = getStoredToken();
      const user = await getCurrentUser(token || undefined);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      // Failed to refresh, user might be logged out
      clearToken();
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { getStoredToken };
