/**
 * TEMPORARY: Auth Bypass for Testing
 * Remove this file once Supabase auth is properly set up
 * 
 * USAGE:
 * - Automatically logs in as admin@oxivo.com
 * - No login page required
 * - To switch to viewer mode, change MOCK_ADMIN to MOCK_VIEWER
 */

import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Mock users for testing
const MOCK_ADMIN: AuthUser = {
  id: 'mock-admin-id',
  email: 'admin@oxivo.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

const MOCK_VIEWER: AuthUser = {
  id: 'mock-viewer-id',
  email: 'viewer@oxivo.com',
  role: 'viewer',
  createdAt: new Date().toISOString(),
};

// Change this to switch between admin and viewer mode
const DEFAULT_USER = MOCK_ADMIN; // or MOCK_VIEWER for read-only mode

// Create context with a non-undefined default to prevent errors
const defaultValue: AuthContextType = {
  user: DEFAULT_USER,
  loading: false,
  isAdmin: DEFAULT_USER.role === 'admin',
  isViewer: DEFAULT_USER.role === 'viewer',
  signIn: async () => ({ success: true }),
  signOut: async () => {},
  refreshSession: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultValue);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Check if user explicitly logged out
  const hasLoggedOut = typeof window !== 'undefined' && sessionStorage.getItem('auth_logged_out') === 'true';
  const [user, setUser] = useState<AuthUser | null>(hasLoggedOut ? null : DEFAULT_USER);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    // Clear logout flag
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_logged_out');
    }
    
    // Mock sign in - switch user based on email
    if (email.includes('admin')) {
      setUser(MOCK_ADMIN);
    } else if (email.includes('viewer')) {
      setUser(MOCK_VIEWER);
    } else {
      // Default to admin for any other email
      setUser(MOCK_ADMIN);
    }
    return { success: true };
  };

  const signOut = async () => {
    // Mark as logged out
    console.log('🚪 [authBypass] signOut called');
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_logged_out', 'true');
      console.log('🚪 [authBypass] Set sessionStorage.auth_logged_out = true');
    }
    
    setUser(null);
    console.log('🚪 [authBypass] Set user = null');
    console.log('🚪 [authBypass] Current user state:', user);
    
    // ✅ FORCE RELOAD: Ensures logout works even if state doesn't update
    console.log('🚪 [authBypass] Force reloading page in 100ms...');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const refreshSession = async () => {
    // No-op for mock
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    isViewer: user?.role === 'viewer',
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  // Since we provide a default value, context should never be undefined
  // But we keep this check for safety
  if (!context) {
    console.error('⚠️ useAuth called outside AuthProvider - returning default values');
    return defaultValue;
  }
  return context;
}

// Debug helper
if (typeof window !== 'undefined') {
  (window as any).__AUTH_BYPASS_ACTIVE__ = true;
  const hasLoggedOut = sessionStorage.getItem('auth_logged_out') === 'true';
  console.log('🔓 Auth Bypass Mode: Active');
  console.log('👤 Default User:', DEFAULT_USER.email, '/', DEFAULT_USER.role);
  console.log('🚪 Logged Out:', hasLoggedOut ? 'Yes (will show login page)' : 'No (auto-login active)');
}