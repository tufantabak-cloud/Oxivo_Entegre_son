/**
 * 🌍 Environment Configuration
 * Centralized environment detection and configuration management
 * 
 * Usage:
 * - import { IS_PRODUCTION, IS_DEVELOPMENT, ENV_CONFIG } from '@/utils/environmentConfig'
 * - Use IS_PRODUCTION to toggle features
 * - Use ENV_CONFIG to access environment-specific settings
 */

// ✅ SAFE ENVIRONMENT DETECTION (handles missing import.meta)
const getImportMetaEnv = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env;
    }
  } catch (e) {
    // import.meta not available
  }
  return { PROD: false, DEV: true, MODE: 'development' };
};

const env = getImportMetaEnv();

// ✅ ENVIRONMENT DETECTION
export const IS_PRODUCTION = env.PROD === true || env.MODE === 'production';
export const IS_DEVELOPMENT = env.DEV === true || env.MODE === 'development';
export const IS_TEST = env.MODE === 'test';

// ✅ FIGMA MAKE DETECTION (read-only environment)
export const IS_FIGMA_MAKE = typeof window !== 'undefined' && (
  window.location.hostname.includes('figma.com') ||
  window.location.hostname.includes('figma-make') ||
  (window as any).__FIGMA_MAKE__ === true
);

// ✅ VERCEL DETECTION
export const IS_VERCEL = typeof window !== 'undefined' && (
  window.location.hostname.includes('vercel.app') ||
  env.VITE_VERCEL === 'true'
);

// ✅ LOCALHOST DETECTION
export const IS_LOCALHOST = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

/**
 * 🔧 Environment-Specific Configuration
 */
export const ENV_CONFIG = {
  // 🔍 Logging
  enableConsoleLogs: IS_DEVELOPMENT || IS_LOCALHOST,
  enableDebugLogs: IS_DEVELOPMENT,
  enableErrorReporting: IS_PRODUCTION,

  // 🔐 Security
  // ⚠️ TEMPORARY: Allow auth bypass on Vercel for testing
  // TODO: Remove IS_VERCEL after setting up real Supabase Auth
  enableAuthBypass: IS_DEVELOPMENT || IS_LOCALHOST || IS_VERCEL,
  enableMigrationTools: IS_DEVELOPMENT || IS_LOCALHOST,
  enableDebugPanel: IS_DEVELOPMENT || IS_LOCALHOST,

  // 🌐 API
  enableSupabase: !IS_FIGMA_MAKE,
  enableLocalStorageFallback: IS_FIGMA_MAKE, // Only for Figma Make

  // 🎨 UI
  showEnvironmentBadge: IS_DEVELOPMENT || IS_VERCEL,
  enableHotReload: IS_DEVELOPMENT,

  // 📊 Performance
  enablePerformanceMonitoring: IS_PRODUCTION,
  batchSize: IS_PRODUCTION ? 1000 : 100,

  // 🚨 Error Handling
  showDetailedErrors: IS_DEVELOPMENT,
  enableErrorBoundary: true,

  // 🌍 Environment Info (for debugging)
  isDevelopment: IS_DEVELOPMENT,
  isProduction: IS_PRODUCTION,
  isVercel: IS_VERCEL,
  isLocalhost: IS_LOCALHOST,
  isFigmaMake: IS_FIGMA_MAKE,
} as const;

/**
 * 🎯 Feature Flags (can be toggled per environment)
 */
export const FEATURE_FLAGS = {
  // Core Features
  enableDSYM: true, // Digital Contract Management
  enableBankPF: true,
  enableReports: true,
  enableDefinitions: true,
  enableTABELA: true,
  enableRevenue: true,

  // Experimental Features (only in dev)
  enableBatchOperations: true,
  enableAdvancedSearch: IS_DEVELOPMENT,
  enableAIAssistant: false, // Future feature

  // Admin Features
  enableDataMigration: ENV_CONFIG.enableMigrationTools,
  enableDuplicateCleanup: IS_DEVELOPMENT,
  enableDatabaseTools: IS_DEVELOPMENT,
} as const;

/**
 * 🔧 Get environment display name
 */
export function getEnvironmentName(): string {
  if (IS_PRODUCTION) return 'Production';
  if (IS_VERCEL) return 'Preview (Vercel)';
  if (IS_LOCALHOST) return 'Local Development';
  if (IS_FIGMA_MAKE) return 'Figma Make';
  return 'Unknown';
}

/**
 * 🎨 Get environment color for UI badges
 */
export function getEnvironmentColor(): string {
  if (IS_PRODUCTION) return 'bg-green-600';
  if (IS_VERCEL) return 'bg-blue-600';
  if (IS_LOCALHOST) return 'bg-purple-600';
  if (IS_FIGMA_MAKE) return 'bg-orange-600';
  return 'bg-gray-600';
}

/**
 * 🛡️ Security Check: Prevent sensitive operations in production
 */
export function assertDevelopmentOnly(operationName: string): void {
  if (IS_PRODUCTION) {
    const error = `🚨 SECURITY: "${operationName}" is not allowed in production`;
    console.error(error);
    throw new Error(error);
  }
}

/**
 * 📋 Log environment info (only in development)
 */
if (typeof window !== 'undefined' && ENV_CONFIG.enableDebugLogs) {
  console.group('🌍 Environment Configuration');
  console.log('Environment:', getEnvironmentName());
  console.log('Production:', IS_PRODUCTION);
  console.log('Development:', IS_DEVELOPMENT);
  console.log('Figma Make:', IS_FIGMA_MAKE);
  console.log('Vercel:', IS_VERCEL);
  console.log('Localhost:', IS_LOCALHOST);
  console.log('Config:', ENV_CONFIG);
  console.log('Features:', FEATURE_FLAGS);
  console.groupEnd();

  // ⚠️ WARNING: Auth bypass active in production
  if (ENV_CONFIG.enableAuthBypass && IS_PRODUCTION) {
    console.error('🚨 CRITICAL SECURITY RISK: Auth bypass is enabled in PRODUCTION!');
  }
}

// ✅ Export environment info to window (ALWAYS - for debugging in all environments)
if (typeof window !== 'undefined') {
  (window as any).__OXIVO_ENV__ = {
    environment: getEnvironmentName(),
    config: ENV_CONFIG,
    features: FEATURE_FLAGS,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_FIGMA_MAKE,
    IS_VERCEL,
    IS_LOCALHOST,
  };
}