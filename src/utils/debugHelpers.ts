/**
 * Development & Debug Utilities
 * Only loaded in development mode
 */

import { logger } from './logger';

// Safe environment detection
const isDev = (() => {
  try {
    return import.meta.env?.DEV ?? false;
  } catch {
    return false;
  }
})();

/**
 * Load Supabase connectivity test utilities
 * Only in development mode
 */
export async function loadSupabaseDebugTools(): Promise<void> {
  if (!isDev) {
    return;
  }

  try {
    // Load connectivity tester
    const connectivityModule = await import('./supabaseConnectivityTest');
    window.SupabaseConnectivityTester = connectivityModule.SupabaseConnectivityTester;
    window.testSupabase = connectivityModule.SupabaseConnectivityTester.testConnection;
    logger.info('🔧 Supabase connectivity test loaded! Run: window.testSupabase()');
  } catch (err) {
    logger.warn('⚠️ Could not load supabaseConnectivityTest:', err);
  }

  try {
    // Load suspension reasons tester
    const suspensionModule = await import('./testSuspensionReasons');
    window.testSuspensionReasons = suspensionModule.quickTestSuspensionReasons;
    logger.info('🔧 Suspension reasons test loaded! Run: window.testSuspensionReasons()');
  } catch (err) {
    logger.warn('⚠️ Could not load testSuspensionReasons:', err);
  }
}

/**
 * Load duplicate cleanup utilities
 * Only in development mode
 */
export async function loadDuplicateCleanupTools(): Promise<void> {
  if (!isDev) {
    return;
  }

  try {
    const { cleanupAllDuplicatesSQL, checkDuplicatesSQL } = await import('./supabaseClient');
    window.cleanupDuplicates = cleanupAllDuplicatesSQL;
    window.checkDuplicates = checkDuplicatesSQL;
    logger.info('🔧 Duplicate cleanup tools loaded!');
    logger.info('   Run: window.checkDuplicates() - Check for duplicates');
    logger.info('   Run: window.cleanupDuplicates() - Clean duplicates');
  } catch (err) {
    logger.warn('⚠️ Could not load duplicate cleanup tools:', err);
  }
}