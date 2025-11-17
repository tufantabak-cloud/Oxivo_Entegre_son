/**
 * useDataSync Hook
 * 
 * Optimized data synchronization with localStorage.
 * Features:
 * - Debouncing (prevent too many writes)
 * - Error handling with retry
 * - Storage quota management
 * - Sync status tracking
 * - Compression support
 * 
 * Usage:
 * const { syncData, isSyncing, error } = useDataSync('customers');
 * 
 * useEffect(() => {
 *   syncData(customers);
 * }, [customers]);
 * 
 * Created: 2025-11-04
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface DataSyncOptions {
  key: string;
  debounceMs?: number; // Default: 500ms
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  compress?: boolean; // Future: LZ compression
  maxRetries?: number; // Default: 3
  silent?: boolean; // Don't show toast notifications
}

interface DataSyncReturn {
  syncData: (data: any) => Promise<void>;
  isSyncing: boolean;
  error: Error | null;
  lastSync: Date | null;
  clearError: () => void;
  forceSync: (data: any) => Promise<void>; // Skip debounce
}

interface SyncQueueItem {
  key: string;
  data: any;
  timestamp: number;
}

// Global sync queue (shared across all hook instances)
const syncQueue: Map<string, SyncQueueItem> = new Map();

// Storage quota monitoring
const QUOTA_WARNING_THRESHOLD = 0.8; // Warn at 80% capacity
const QUOTA_ERROR_THRESHOLD = 0.95; // Error at 95% capacity

/**
 * Check localStorage quota
 */
function checkStorageQuota(): { used: number; available: number; percentage: number } {
  let used = 0;
  
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
  } catch (error) {
    console.error('Error checking storage quota:', error);
  }

  // Most browsers: ~5-10MB limit
  const available = 10 * 1024 * 1024; // 10MB estimate
  const percentage = used / available;

  return { used, available, percentage };
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, ...
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * useDataSync Hook
 */
export function useDataSync(options: DataSyncOptions | string): DataSyncReturn {
  // Normalize options
  const opts: Required<DataSyncOptions> = typeof options === 'string'
    ? {
        key: options,
        debounceMs: 500,
        onError: undefined as any,
        onSuccess: undefined as any,
        compress: false,
        maxRetries: 3,
        silent: false,
      }
    : {
        debounceMs: 500,
        onError: undefined as any,
        onSuccess: undefined as any,
        compress: false,
        maxRetries: 3,
        silent: false,
        ...options,
      };

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Perform actual sync (with retry)
   */
  const performSync = useCallback(async (key: string, data: any): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      setIsSyncing(true);
      setError(null);

      // Check storage quota BEFORE saving
      const quota = checkStorageQuota();

      if (quota.percentage > QUOTA_ERROR_THRESHOLD) {
        throw new Error(
          `localStorage kapasitesi dolu! (${formatBytes(quota.used)} / ${formatBytes(quota.available)}). ` +
          `Lütfen bazı verileri silin veya export edin.`
        );
      }

      if (quota.percentage > QUOTA_WARNING_THRESHOLD && !opts.silent) {
        toast.warning(
          `localStorage dolmak üzere! (${Math.round(quota.percentage * 100)}% dolu)`,
          { duration: 5000 }
        );
      }

      // Serialize data
      const serialized = JSON.stringify(data);
      const sizeInBytes = new Blob([serialized]).size;

      console.log(`💾 Syncing ${key} (${formatBytes(sizeInBytes)})`);

      // Perform save with retry
      await retryWithBackoff(
        async () => {
          localStorage.setItem(key, serialized);
        },
        opts.maxRetries
      );

      // Success!
      if (mountedRef.current) {
        setLastSync(new Date());

        if (!opts.silent) {
          // Don't show toast for every save (too noisy)
          console.log(`✅ ${key} synced successfully`);
        }

        opts.onSuccess?.();
      }
    } catch (err) {
      const error = err as Error;
      console.error(`❌ Sync error for ${key}:`, error);

      if (mountedRef.current) {
        setError(error);

        if (!opts.silent) {
          toast.error(`Veri kaydedilemedi: ${error.message}`, {
            duration: 5000,
          });
        }

        opts.onError?.(error);
      }

      throw error;
    } finally {
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [opts]);

  /**
   * Sync data (with debounce)
   */
  const syncData = useCallback(async (data: any): Promise<void> => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Add to queue
    syncQueue.set(opts.key, {
      key: opts.key,
      data,
      timestamp: Date.now(),
    });

    // Debounce
    return new Promise((resolve, reject) => {
      debounceTimerRef.current = setTimeout(async () => {
        const item = syncQueue.get(opts.key);
        if (!item) {
          resolve();
          return;
        }

        try {
          await performSync(item.key, item.data);
          syncQueue.delete(opts.key);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, opts.debounceMs);
    });
  }, [opts.key, opts.debounceMs, performSync]);

  /**
   * Force sync (skip debounce)
   */
  const forceSync = useCallback(async (data: any): Promise<void> => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear from queue
    syncQueue.delete(opts.key);

    // Immediate sync
    return performSync(opts.key, data);
  }, [opts.key, performSync]);

  return {
    syncData,
    isSyncing,
    error,
    lastSync,
    clearError,
    forceSync,
  };
}

/**
 * useBatchDataSync - Sync multiple keys at once
 */
export function useBatchDataSync(keys: string[], options?: Omit<DataSyncOptions, 'key'>) {
  const syncHooks = keys.map(key => useDataSync({ key, ...options }));

  const syncAll = useCallback(async (dataMap: Record<string, any>): Promise<void> => {
    const promises = Object.entries(dataMap).map(async ([key, data]) => {
      const hook = syncHooks.find(h => h === syncHooks[keys.indexOf(key)]);
      if (hook) {
        await hook.syncData(data);
      }
    });

    await Promise.all(promises);
  }, [syncHooks, keys]);

  const isSyncing = syncHooks.some(h => h.isSyncing);
  const errors = syncHooks.map(h => h.error).filter(Boolean);

  return {
    syncAll,
    isSyncing,
    errors,
    clearErrors: () => syncHooks.forEach(h => h.clearError()),
  };
}

/**
 * useAutoSync - Automatically sync data when it changes
 */
export function useAutoSync<T>(key: string, data: T, options?: Omit<DataSyncOptions, 'key'>) {
  const { syncData, ...rest } = useDataSync({ key, ...options });

  useEffect(() => {
    syncData(data).catch(error => {
      console.error(`Auto-sync error for ${key}:`, error);
    });
  }, [data, syncData, key]);

  return rest;
}

/**
 * Storage Utilities
 */
export const storageUtils = {
  /**
   * Get storage info
   */
  getInfo: () => checkStorageQuota(),

  /**
   * Clear all data (with confirmation)
   */
  clearAll: (): boolean => {
    if (confirm('Tüm yerel veriler silinecek! Emin misiniz?')) {
      try {
        localStorage.clear();
        toast.success('Tüm veriler temizlendi');
        return true;
      } catch (error) {
        toast.error('Veriler temizlenemedi');
        return false;
      }
    }
    return false;
  },

  /**
   * Get largest items (for cleanup)
   */
  getLargestItems: (limit: number = 10) => {
    const items: Array<{ key: string; size: number }> = [];

    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key);
          if (value) {
            items.push({
              key,
              size: new Blob([value]).size,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting largest items:', error);
    }

    return items
      .sort((a, b) => b.size - a.size)
      .slice(0, limit)
      .map(item => ({
        ...item,
        sizeFormatted: formatBytes(item.size),
      }));
  },

  /**
   * Export all data to JSON
   */
  exportAll: (): string => {
    const data: Record<string, any> = {};
    
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }

    return JSON.stringify(data, null, 2);
  },
};

export default useDataSync;
