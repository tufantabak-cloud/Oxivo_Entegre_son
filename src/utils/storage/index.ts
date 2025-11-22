/**
 * Storage Module - Unified Export
 * 
 * Created: 2025-11-17
 * 
 * Usage:
 * ```ts
 * import { storage, setStorageStrategy } from './utils/storage';
 * 
 * // Get data
 * const customers = await storage.get('customers');
 * 
 * // Set data
 * await storage.set('customers', customersArray);
 * 
 * // Change strategy
 * setStorageStrategy('supabase-primary');
 * ```
 */

import { HybridStorageAdapter } from './HybridStorageAdapter';
import { StorageAdapter, StorageStrategy, StorageConfig } from './StorageAdapter';

// Default config
const defaultConfig: StorageConfig = {
  strategy: 'supabase-primary', // ✅ FIX: Supabase'i primary yap
  enableLogging: import.meta.env?.DEV ?? false, // Development'ta log aç (SSR-safe)
};

// Singleton instance
let storageInstance: HybridStorageAdapter | null = null;

/**
 * Get singleton storage instance
 */
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new HybridStorageAdapter(defaultConfig);
  }
  return storageInstance;
}

/**
 * Initialize storage with custom config
 */
export function initStorage(config: Partial<StorageConfig> = {}): StorageAdapter {
  const mergedConfig: StorageConfig = {
    ...defaultConfig,
    ...config,
  };
  
  storageInstance = new HybridStorageAdapter(mergedConfig);
  return storageInstance;
}

/**
 * Set storage strategy (runtime değişiklik)
 */
export function setStorageStrategy(strategy: StorageStrategy): void {
  const storage = getStorage();
  if (storage instanceof HybridStorageAdapter) {
    storage.setStrategy(strategy);
  }
}

/**
 * Get current strategy
 */
export function getStorageStrategy(): StorageStrategy | null {
  const storage = getStorage();
  if (storage instanceof HybridStorageAdapter) {
    return storage.getStrategy();
  }
  return null;
}

/**
 * Migrate localStorage → Supabase
 */
export async function migrateToSupabase(): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> {
  const storage = getStorage();
  if (storage instanceof HybridStorageAdapter) {
    return await storage.migrateToSupabase();
  }
  return {
    success: false,
    migrated: 0,
    errors: ['Storage is not HybridStorageAdapter'],
  };
}

/**
 * Sync from Supabase → localStorage (cache refresh)
 */
export async function syncFromSupabase(): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const storage = getStorage();
  if (storage instanceof HybridStorageAdapter) {
    return await storage.syncFromSupabase();
  }
  return {
    success: false,
    synced: 0,
    errors: ['Storage is not HybridStorageAdapter'],
  };
}

// Export default storage instance
export const storage = getStorage();

// Re-export types
export type { StorageAdapter, StorageStrategy, StorageConfig } from './StorageAdapter';

// ========================================
// RE-EXPORT LEGACY FUNCTIONS
// ========================================

// Legacy localStorage fonksiyonları (backward compatibility)
export { 
  getStoredData,
  setStoredData,
  removeStoredData,
  clearStorage,
  getStoredDataAsync,
  setStoredDataAsync
} from './legacy';