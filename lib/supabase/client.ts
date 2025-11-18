/**
 * Supabase Client Singleton
 * Frontend'de Supabase ile etkileşim için merkezi client
 * 
 * Updated: 2025-11-17 - Moved to /lib/supabase (standard convention)
 * 
 * NOTE: Bu dosya /utils/supabase/client.ts ile senkron tutulmalıdır
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables (SSR-safe with optional chaining)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Missing Supabase environment variables. ' +
    'Please check .env.local file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
  // Don't throw during SSR/build - create dummy client
}

// Create singleton client with optimized settings
// Use fallback values for SSR/build safety
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Helper: Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Helper: Get current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Helper: Sign out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Helper: Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};
