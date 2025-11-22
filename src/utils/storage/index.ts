/*COMMENT*/

import { HybridStorageAdapter } from './HybridStorageAdapter';
import { StorageAdapter, StorageStrategy, StorageConfig } from './StorageAdapter';

// Default config
const defaultConfig: StorageConfig = {
  strategy: 'localStorage-primary', // Güvenli baslangiç: localStorage öncelikli
  enableLogging: import.meta.env?.DEV ?? false, // Development'ta log aç (SSR-safe)
};

// Singleton instance
let storageInstance: HybridStorageAdapter | null = null;

/*COMMENT*/
export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new HybridStorageAdapter(defaultConfig);
  }
  return storageInstance;
}

/*COMMENT*/
export function initStorage(config: Partial<StorageConfig> = {}): StorageAdapter {
  const mergedConfig: StorageConfig = {
    ...defaultConfig,
    ...config,
  };
  
  storageInstance = new HybridStorageAdapter(mergedConfig);
  return storageInstance;
}

/*COMMENT*/
export function setStorageStrategy(strategy: StorageStrategy): void {
  const storage = getStorage();
  if (storage instanceof HybridStorageAdapter) {
    storage.setStrategy(strategy);
  }
}

/*COMMENT*/
export function getStorageStrategy(): StorageStrategy | null {
  const storage = getStorage();
  if (storage instanceof HybridStorageAdapter) {
    return storage.getStrategy();
  }
  return null;
}

/*COMMENT*/
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

/*COMMENT*/
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


