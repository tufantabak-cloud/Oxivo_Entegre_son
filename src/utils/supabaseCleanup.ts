/**
 * Supabase Cleanup Utility
 * Eski session'ları ve duplicate client instance'larını temizler
 */

const SUPABASE_STORAGE_KEYS = [
  'sb-tveqpmzgqtoyagtpapev-auth-token',
  'sb-tveqpmzgqtoyagtpapev-auth-token-code-verifier',
];

/**
 * Supabase session cleanup
 * Sayfa yüklendiğinde çağrılmalı
 */
export function cleanupSupabaseSession() {
  if (typeof window === 'undefined') return;

  try {
    // Check for multiple auth tokens (indicates duplicate instances)
    const keys = Object.keys(localStorage);
    const authTokenKeys = keys.filter(key => 
      key.includes('supabase') && 
      key.includes('auth-token') && 
      !SUPABASE_STORAGE_KEYS.includes(key)
    );

    if (authTokenKeys.length > 0) {
      console.warn('⚠️ Found legacy Supabase keys, cleaning up...', authTokenKeys);
      authTokenKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`🧹 Removed legacy key: ${key}`);
        } catch (e) {
          console.error(`Failed to remove key: ${key}`, e);
        }
      });
    }
  } catch (error) {
    console.error('Error during Supabase cleanup:', error);
  }
}

/**
 * Reset Supabase session completely
 * Kullanıcı logout olduğunda veya auth sorunları yaşandığında çağrılır
 */
export function resetSupabaseSession() {
  if (typeof window === 'undefined') return;

  try {
    console.log('🔄 Resetting Supabase session...');
    
    // Remove all Supabase related keys
    SUPABASE_STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Supabase session reset complete');
  } catch (error) {
    console.error('Error resetting Supabase session:', error);
  }
}

/**
 * Check if there are multiple Supabase client instances
 */
export function checkForDuplicateClients() {
  if (typeof window === 'undefined') return false;

  const keys = Object.keys(window);
  const supabaseClientKeys = keys.filter(key => 
    key.includes('supabase') && key.includes('client')
  );

  if (supabaseClientKeys.length > 1) {
    console.warn('⚠️ Multiple Supabase client instances detected:', supabaseClientKeys);
    return true;
  }

  return false;
}
