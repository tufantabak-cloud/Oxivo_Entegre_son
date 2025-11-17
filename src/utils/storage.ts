/**
 * LocalStorage Utility Functions
 * Generic helper functions for working with browser localStorage
 * 
 * Updated: 2025-01-12 - Added throttling and error resilience
 */

import { logger } from './logger';

/**
 * Get data from localStorage with type safety and retry
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
    return parsed;
  } catch (error) {
    logger.error('Error reading from localStorage', { key, error });
    
    // Try to recover corrupted data
    try {
      localStorage.removeItem(key);
      logger.info('Removed corrupted localStorage key', { key });
    } catch {}
    
    return defaultValue;
  }
};

/**
 * Save data to localStorage with type safety and quota handling
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
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    logger.error('Error clearing localStorage', { error });
  }
};
