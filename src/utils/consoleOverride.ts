/**
 * 🔇 Production Console Override
 * Silences debug/info/warn logs in production while keeping errors
 * 
 * This is a safety net for any console.log() calls that weren't converted to logger
 * 
 * Import this file ONCE in main.tsx to activate globally
 */

import { ENV_CONFIG } from './environmentConfig';

/**
 * Store original console methods
 */
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  group: console.group,
  groupEnd: console.groupEnd,
  groupCollapsed: console.groupCollapsed,
  table: console.table,
};

/**
 * Override console in production
 */
export function overrideConsoleInProduction(): void {
  // 🔧 TEMPORARILY DISABLED FOR DEBUGGING
  // Enable this to see debug logs during development
  return;
  
  if (!ENV_CONFIG.enableConsoleLogs) {
    // ✅ Silence non-critical logs in production
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.group = () => {};
    console.groupEnd = () => {};
    console.groupCollapsed = () => {};
    console.table = () => {};

    // ✅ Keep error logs (critical for production debugging)
    console.error = originalConsole.error;

    // ✅ Log once that console is silenced
    originalConsole.log('🔇 Production mode: Console logs silenced (errors still logged)');
  }
}

/**
 * Restore original console (for testing)
 */
export function restoreConsole(): void {
  Object.assign(console, originalConsole);
}

/**
 * Get original console methods (for internal use)
 */
export function getOriginalConsole() {
  return originalConsole;
}