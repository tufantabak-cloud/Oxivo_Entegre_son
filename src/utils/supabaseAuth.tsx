/**
 * 🔐 Real Supabase Authentication
 * 
 * This replaces authBypass.tsx for production use
 * 
 * USAGE:
 * 1. Create user in Supabase Dashboard > Authentication > Users
 * 2. Replace AuthProvider in main.tsx:
 *    import { AuthProvider } from './utils/supabaseAuth'
 * 3. Deploy with VITE_ENABLE_AUTH_BYPASS=false
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { logger } from './logger';
import { ENV_CONFIG } from './environmentConfig';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface UserData {
  email: string;
  role: 'admin' | 'viewer';
  userId: string;
  fullName?: string;
}

interface AuthContextType {
  user: UserData | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROVIDER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Map Supabase User to UserData
  const mapUser = (supabaseUser: User | null): UserData | null => {
    if (!supabaseUser) return null;

    return {
      email: supabaseUser.email || '',
      userId: supabaseUser.id,
      // Default to admin role (customize based on your needs)
      role: 'admin',
      fullName: supabaseUser.user_metadata?.full_name,
    };
  };

  // ✅ Initialize auth state
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(mapUser(session?.user || null));
      setIsLoading(false);
      
      if (session) {
        logger.info('🔐 User session restored:', session.user.email);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(mapUser(session?.user || null));
        
        if (_event === 'SIGNED_IN') {
          logger.info('🔐 User signed in:', session?.user.email);
        } else if (_event === 'SIGNED_OUT') {
          logger.info('🔓 User signed out');
        } else if (_event === 'TOKEN_REFRESHED') {
          logger.debug('🔄 Token refreshed');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(mapUser(data.user));
      
      logger.info('✅ Login successful:', email);
    } catch (error) {
      logger.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      setSession(null);
      setUser(null);
      
      logger.info('✅ Logout successful');
    } catch (error) {
      logger.error('❌ Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Sign Up (optional - for self-registration)
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // If email confirmation is disabled, user is logged in automatically
      if (data.session) {
        setSession(data.session);
        setUser(mapUser(data.user));
      }
      
      logger.info('✅ Sign up successful:', email);
    } catch (error) {
      logger.error('❌ Sign up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Refresh session token
 */
export async function refreshSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    logger.error('Failed to refresh session:', error);
    return null;
  }
  
  return session;
}

/**
 * Magic link login (passwordless)
 */
export async function sendMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw error;
  }

  logger.info('✅ Magic link sent to:', email);
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw error;
  }

  logger.info('✅ Password reset email sent to:', email);
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  logger.info('✅ Password updated successfully');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEBUG INFO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (ENV_CONFIG.enableDebugLogs) {
  logger.group('🔐 Supabase Auth Configuration');
  logger.info('Auth Mode: Real Supabase Authentication');
  logger.info('Session Persistence: localStorage');
  logger.info('Auto Token Refresh: Enabled');
  logger.groupEnd();
}
