/**
 * Global TypeScript Type Definitions
 * Prevents 'any' type usage for window object extensions
 */

interface Window {
  // Supabase connectivity testing (dev only)
  SupabaseConnectivityTester?: any;
  testSupabase?: () => void;
  testSuspensionReasons?: () => void;
  
  // Debug utilities (dev only)
  cleanupDuplicates?: () => Promise<void>;
  checkDuplicates?: () => Promise<void>;
  
  // App lifecycle tracking (prevents auto-sync during initial load)
  __APP_MOUNT_TIME__?: number;
}

// Extend ImportMeta for environment variables
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
