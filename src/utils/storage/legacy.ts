/**
 * Legacy Storage Functions
 * 
 * Eski localStorage wrapper fonksiyonları
 * Backward compatibility için korunuyor
 * 
 * Created: 2025-11-19
 */

import { logger } from '../logger';

// ========================================
// LEGACY LOCALSTORAGE FUNCTIONS (OLD)
// ========================================

/**
 * Get data from localStorage with type safety and retry
 * @deprecated Use `storage.get()` instead
 * @param key - LocalStorage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns Parsed value or default
 */
export const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    // Try to parse
    const parsed = JSON.parse(stored);
    
    // ✅ CRITICAL FIX: Ensure parsed value is not null/undefined
    if (parsed === null || parsed === undefined) {
      logger.warn(`localStorage key "${key}" returned null/undefined, using default`, { key });
      return defaultValue;
    }
    
    // ✅ ARRAY SAFETY: If defaultValue is array, ensure parsed is also array
    if (Array.isArray(defaultValue)) {
      if (!Array.isArray(parsed)) {
        logger.warn(`localStorage key "${key}" expected array but got ${typeof parsed}, using default`, { 
          key, 
          type: typeof parsed,
          value: parsed 
        });
        return defaultValue;
      }
      
      // ✅ EXTRA SAFETY: Filter out invalid items from array
      const validItems = parsed.filter(item => item !== null && item !== undefined);
      if (validItems.length !== parsed.length) {
        logger.warn(`Removed ${parsed.length - validItems.length} null/undefined items from "${key}"`, { 
          key,
          original: parsed.length,
          cleaned: validItems.length
        });
      }
      return validItems as T;
    }
    
    return parsed;
  } catch (error) {
    logger.error(`Error reading from localStorage key "${key}"`, { key, error });
    
    // Try to recover corrupted data
    try {
      localStorage.removeItem(key);
      logger.info(`Removed corrupted localStorage key "${key}"`, { key });
    } catch {
      // Ignore cleanup errors
    }
    
    return defaultValue;
  }
};

/**
 * Save data to localStorage with type safety and quota handling
 * @deprecated Use `storage.set()` instead
 * @param key - LocalStorage key
 * @param value - Value to store (will be JSON stringified)
 */
export const setStoredData = <T,>(key: string, value: T): void => {
  try {
    const stringified = JSON.stringify(value);
    localStorage.setItem(key, stringified);
  } catch (error: any) {
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
      logger.error('LocalStorage quota exceeded', { key });
      
      // Try to free up space by removing old activity logs
      try {
        const keysToClean = ['activityLogs', 'debugLogs', 'oldCustomers'];
        keysToClean.forEach(k => {
          if (k !== key) {
            localStorage.removeItem(k);
          }
        });
        
        // Retry after cleanup
        localStorage.setItem(key, JSON.stringify(value));
        logger.info('Successfully saved after quota cleanup', { key });
      } catch {
        logger.error('Failed to save even after cleanup', { key });
      }
    } else {
      logger.error('Error saving to localStorage', { key, error });
    }
  }
};

/**
 * Remove item from localStorage
 * @deprecated Use `storage.remove()` instead
 * @param key - LocalStorage key
 */
export const removeStoredData = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logger.error('Error removing from localStorage', { key, error });
  }
};

/**
 * Clear all localStorage data
 * @deprecated Use `storage.clear()` instead
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    logger.error('Error clearing localStorage', { error });
  }
};

// ========================================
// ASYNC WRAPPERS (Hybrid Storage)
// ========================================

/**
 * Get data with Hybrid Storage (async version)
 * Bu fonksiyon artık Supabase destekli hybrid storage kullanır
 */
export const getStoredDataAsync = async <T,>(key: string, defaultValue: T): Promise<T> => {
  try {
    // Import storage dynamically to avoid circular deps
    const { storage } = await import('./index');
    const value = await storage.get<T>(key);
    return value ?? defaultValue;
  } catch (error) {
    logger.error('Error reading from hybrid storage', { key, error });
    return defaultValue;
  }
};

/**
 * Set data with Hybrid Storage (async version)
 */
export const setStoredDataAsync = async <T,>(key: string, value: T): Promise<void> => {
  try {
    // Import storage dynamically to avoid circular deps
    const { storage } = await import('./index');
    await storage.set(key, value);
  } catch (error) {
    logger.error('Error saving to hybrid storage', { key, error });
    throw error;
  }
};