/**
 * LocalStorage Adapter
 * Browser localStorage kullanan implementation
 * 
 * Created: 2025-11-17
 */

import { StorageAdapter } from './StorageAdapter';
import { logger } from '../logger';

export class LocalStorageAdapter implements StorageAdapter {
  getName(): string {
    return 'LocalStorage';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('LocalStorageAdapter: get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error: any) {
      // Quota exceeded handling
      if (error.name === 'QuotaExceededError') {
        logger.error('LocalStorageAdapter: quota exceeded', { key });
        // Try to free space
        this.cleanup();
        // Retry once
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          throw new Error(`LocalStorage quota exceeded for key: ${key}`);
        }
      } else {
        logger.error('LocalStorageAdapter: set error', { key, error });
        throw error;
      }
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('LocalStorageAdapter: remove error', { key, error });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('LocalStorageAdapter: clear error', { error });
      throw error;
    }
  }

  async getByPrefix<T>(prefix: string): Promise<Record<string, T>> {
    try {
      const result: Record<string, T> = {};
      const keys = await this.keys();
      
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          const value = await this.get<T>(key);
          if (value !== null) {
            result[key] = value;
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('LocalStorageAdapter: getByPrefix error', { prefix, error });
      return {};
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      logger.error('LocalStorageAdapter: keys error', { error });
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const testKey = '__health_check__';
      const testValue = { timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved !== null;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup old/temporary data to free space
   */
  private cleanup(): void {
    const keysToClean = [
      'activityLogs',
      'debugLogs',
      'tempData',
      '__health_check__',
    ];

    keysToClean.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
  }
}
