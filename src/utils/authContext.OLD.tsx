/**
 * ⚠️ DEPRECATED - DO NOT USE
 * This file is kept for reference only
 * Use /utils/authBypass.tsx instead during development
 * 
 * Authentication Context
 * Manages user authentication state and role-based access control
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from './logger';

// Lazy import supabase to avoid SSR issues
let supabase: any = null;
const getSupabase = async () => {
  if (!supabase) {
    const module = await import('./supabaseClient');
    supabase = module.supabase;
  }
  return supabase;
};

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user role from metadata
  const getUserRole = (metadata: any): UserRole => {
    return metadata?.role === 'admin' ? 'admin' : 'viewer';
  };

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sb = await getSupabase();
        const { data: { session }, error } = await sb.auth.getSession();
        
        if (error) {
          logger.error('Session load error:', error);
          setUser(null);
        } else if (session?.user) {
          const role = getUserRole(session.user.user_metadata);
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role,
            createdAt: session.user.created_at
          });
          logger.info('✅ User session loaded:', session.user.email, 'Role:', role);
        } else {
          setUser(null);
        }
      } catch (err) {
        logger.error('Session load failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Listen for auth changes
    getSupabase().then(sb => {
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event: string, session: any) => {
        logger.debug('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const role = getUserRole(session.user.user_metadata);
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role,
            createdAt: session.user.created_at
          });
          logger.info('✅ User signed in:', session.user.email, 'Role:', role);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          logger.info('👋 User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          logger.debug('🔄 Token refreshed');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const sb = await getSupabase();
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        logger.error('Sign in error:', error);
        return { 
          success: false, 
          error: error.message === 'Invalid login credentials' 
            ? 'Email veya şifre hatalı' 
            : 'Giriş başarısız. Lütfen tekrar deneyin.' 
        };
      }

      if (!data.user) {
        return { success: false, error: 'Kullanıcı bulunamadı' };
      }

      const role = getUserRole(data.user.user_metadata);
      setUser({
        id: data.user.id,
        email: data.user.email!,
        role,
        createdAt: data.user.created_at
      });

      logger.info('✅ Sign in successful:', data.user.email, 'Role:', role);
      return { success: true };

    } catch (err: any) {
      logger.error('Sign in failed:', err);
      return { success: false, error: 'Beklenmeyen bir hata oluştu' };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const sb = await getSupabase();
      const { error } = await sb.auth.signOut();
      
      if (error) {
        logger.error('Sign out error:', error);
      } else {
        setUser(null);
        logger.info('👋 User signed out');
      }
    } catch (err) {
      logger.error('Sign out failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      const sb = await getSupabase();
      const { data: { session }, error } = await sb.auth.refreshSession();
      
      if (error) {
        logger.error('Session refresh error:', error);
      } else if (session?.user) {
        const role = getUserRole(session.user.user_metadata);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role,
          createdAt: session.user.created_at
        });
        logger.debug('🔄 Session refreshed');
      }
    } catch (err) {
      logger.error('Session refresh failed:', err);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    isViewer: user?.role === 'viewer',
    signIn,
    signOut,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
