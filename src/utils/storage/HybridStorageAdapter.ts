/*COMMENT*/

import { StorageAdapter, StorageStrategy, StorageConfig } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseStorageAdapter } from './SupabaseStorageAdapter';
import { logger } from '../logger';

export class HybridStorageAdapter implements StorageAdapter {
  private localStorage: LocalStorageAdapter;
  private supabaseStorage: SupabaseStorageAdapter;
  private strategy: StorageStrategy;
  private enableLogging: boolean;

  constructor(config: StorageConfig) {
    this.localStorage = new LocalStorageAdapter();
    this.supabaseStorage = new SupabaseStorageAdapter();
    this.strategy = config.strategy;
    this.enableLogging = config.enableLogging ?? false;
  }

  getName(): string {
    return `Hybrid[${this.strategy}]`;
  }

  async get<T>(key: string): Promise<T | null> {
    this.log('get', key);

    try {
      switch (this.strategy) {
        case 'localStorage-primary':
          return await this.getLocalStoragePrimary<T>(key);
        
        case 'supabase-primary':
          return await this.getSupabasePrimary<T>(key);
        
        case 'localStorage-only':
          return await this.localStorage.get<T>(key);
        
        case 'supabase-only':
          return await this.supabaseStorage.get<T>(key);
        
        default:
          return await this.localStorage.get<T>(key);
      }
    } catch (error) {
      logger.error('HybridStorageAdapter: get error', { key, strategy: this.strategy, error });
      // Fallback to localStorage
      return await this.localStorage.get<T>(key);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.log('set', key);

    try {
      switch (this.strategy) {
        case 'localStorage-primary':
          await this.setLocalStoragePrimary(key, value);
          break;
        
        case 'supabase-primary':
          await this.setSupabasePrimary(key, value);
          break;
        
        case 'localStorage-only':
          await this.localStorage.set(key, value);
          break;
        
        case 'supabase-only':
          await this.supabaseStorage.set(key, value);
          break;
      }
    } catch (error) {
      logger.error('HybridStorageAdapter: set error', { key, strategy: this.strategy, error });
      
      // Fallback: En azindan localStorage'a yaz
      try {
        await this.localStorage.set(key, value);
        logger.info('HybridStorageAdapter: fallback to localStorage successful', { key });
      } catch (fallbackError) {
        logger.error('HybridStorageAdapter: fallback failed', { key, fallbackError });
        throw error;
      }
    }
  }

  async remove(key: string): Promise<void> {
    this.log('remove', key);

    try {
      // Her iki storage'dan da sil
      await Promise.allSettled([
        this.localStorage.remove(key),
        this.supabaseStorage.remove(key),
      ]);
    } catch (error) {
      logger.error('HybridStorageAdapter: remove error', { key, error });
      throw error;
    }
  }

  async clear(): Promise<void> {
    this.log('clear', 'all');

    try {
      // Her iki storage'i da temizle
      await Promise.allSettled([
        this.localStorage.clear(),
        this.supabaseStorage.clear(),
      ]);
    } catch (error) {
      logger.error('HybridStorageAdapter: clear error', { error });
      throw error;
    }
  }

  async getByPrefix<T>(prefix: string): Promise<Record<string, T>> {
    this.log('getByPrefix', prefix);

    try {
      // Her iki storage'dan da çek ve merge et
      const [localData, supabaseData] = await Promise.allSettled([
        this.localStorage.getByPrefix<T>(prefix),
        this.supabaseStorage.getByPrefix<T>(prefix),
      ]);

      const local = localData.status === 'fulfilled' ? localData.value : {};
      const supabase = supabaseData.status === 'fulfilled' ? supabaseData.value : {};

      // Strategy'ye göre merge
      if (this.strategy === 'supabase-primary') {
        return { ...local, ...supabase };
      } else {
        return { ...supabase, ...local };
      }
    } catch (error) {
      logger.error('HybridStorageAdapter: getByPrefix error', { prefix, error });
      return {};
    }
  }

  async keys(): Promise<string[]> {
    try {
      const [localKeys, supabaseKeys] = await Promise.all([
        this.localStorage.keys(),
        this.supabaseStorage.keys(),
      ]);

      // Unique keys
      return Array.from(new Set([...localKeys, ...supabaseKeys]));
    } catch (error) {
      logger.error('HybridStorageAdapter: keys error', { error });
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const [localHealthy, supabaseHealthy] = await Promise.all([
        this.localStorage.isHealthy(),
        this.supabaseStorage.isHealthy(),
      ]);

      // En az biri healthy olmali
      return localHealthy || supabaseHealthy;
    } catch {
      return false;
    }
  }

  /*COMMENT*/
  setStrategy(strategy: StorageStrategy): void {
    this.log('setStrategy', strategy);
    this.strategy = strategy;
  }

  /*COMMENT*/
  getStrategy(): StorageStrategy {
    return this.strategy;
  }

  /*COMMENT*/
  async migrateToSupabase(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
    this.log('migrateToSupabase', 'starting');

    const errors: string[] = [];
    let migrated = 0;

    try {
      const keys = await this.localStorage.keys();
      const migrateableKeys = keys.map(key => 
        key === 'customers' || 
        key === 'payterProducts' || 
        key === 'domains' || 
        key === 'bankPFRecords'
      );

      for (const key of migrateableKeys) {
        try {
          const value = await this.localStorage.get(key);
          if (value !== null) {
            await this.supabaseStorage.set(key, value);
            migrated++;
            logger.info('HybridStorageAdapter: migrated key', { key });
          }
        } catch (error: any) {
          const errorMsg = `Failed to migrate ${key}: ${error?.message}`;
          errors.push(errorMsg);
          logger.error('HybridStorageAdapter: migration error', { key, error });
        }
      }

      return {
        success: errors.length === 0,
        migrated,
        errors,
      };
    } catch (error: any) {
      return {
        success: false,
        migrated,
        errors: [`Migration failed: ${error?.message}`],
      };
    }
  }

  /*COMMENT*/
  async syncFromSupabase(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    this.log('syncFromSupabase', 'starting');

    const errors: string[] = [];
    let synced = 0;

    try {
      const keys = ['customers', 'payterProducts', 'domains', 'bankPFRecords'];

      for (const key of keys) {
        try {
          const value = await this.supabaseStorage.get(key);
          if (value !== null) {
            await this.localStorage.set(key, value);
            synced++;
            logger.info('HybridStorageAdapter: synced key', { key });
          }
        } catch (error: any) {
          const errorMsg = `Failed to sync ${key}: ${error?.message}`;
          errors.push(errorMsg);
          logger.error('HybridStorageAdapter: sync error', { key, error });
        }
      }

      return {
        success: errors.length === 0,
        synced,
        errors,
      };
    } catch (error: any) {
      return {
        success: false,
        synced,
        errors: [`Sync failed: ${error?.message}`],
      };
    }
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private async getLocalStoragePrimary<T>(key: string): Promise<T | null> {
    // Ilk önce localStorage'dan oku
    const localValue = await this.localStorage.get<T>(key);
    
    if (localValue !== null) {
      return localValue;
    }

    // localStorage'da yoksa Supabase'den çek
    const supabaseValue = await this.supabaseStorage.get<T>(key);
    
    // Supabase'de varsa localStorage'a cache'le
    if (supabaseValue !== null) {
      try {
        await this.localStorage.set(key, supabaseValue);
      } catch {
        // Cache hatasi önemli degil
      }
    }

    return supabaseValue;
  }

  private async getSupabasePrimary<T>(key: string): Promise<T | null> {
    // Ilk önce Supabase'den oku
    const supabaseValue = await this.supabaseStorage.get<T>(key);
    
    if (supabaseValue !== null) {
      // localStorage'a cache'le
      try {
        await this.localStorage.set(key, supabaseValue);
      } catch {
        // Cache hatasi önemli degil
      }
      return supabaseValue;
    }

    // Supabase'de yoksa localStorage'dan fallback
    return await this.localStorage.get<T>(key);
  }

  private async setLocalStoragePrimary<T>(key: string, value: T): Promise<void> {
    // Ilk önce localStorage'a yaz
    await this.localStorage.set(key, value);
    
    // Sonra Supabase'e de yaz (background, hata olsa da devam et)
    this.supabaseStorage.set(key, value).catch(error => {
      logger.warn('HybridStorageAdapter: background Supabase sync failed', { key, error });
    });
  }

  private async setSupabasePrimary<T>(key: string, value: T): Promise<void> {
    // Ilk önce Supabase'e yaz
    await this.supabaseStorage.set(key, value);
    
    // Sonra localStorage'a da cache'le (background)
    this.localStorage.set(key, value).catch(error => {
      logger.warn('HybridStorageAdapter: background localStorage cache failed', { key, error });
    });
  }

  private log(operation: string, detail: string): void {
    if (this.enableLogging) {
      logger.info(`HybridStorage[${this.strategy}]: ${operation}`, { detail });
    }
  }
}




