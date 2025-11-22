/**
 * Storage Adapter Interface
 * Tüm storage implementation'ları bu interface'i implement eder
 * 
 * Created: 2025-11-17
 * Purpose: localStorage → Supabase migration için abstract layer
 */

export interface StorageAdapter {
  /**
   * Veri okuma
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Veri yazma
   */
  set<T>(key: string, value: T): Promise<void>;
  
  /**
   * Veri silme
   */
  remove(key: string): Promise<void>;
  
  /**
   * Tüm verileri temizleme
   */
  clear(): Promise<void>;
  
  /**
   * Prefix ile veri okuma (örn: "customer_" ile başlayan tüm keyler)
   */
  getByPrefix<T>(prefix: string): Promise<Record<string, T>>;
  
  /**
   * Tüm key'leri listeleme
   */
  keys(): Promise<string[]>;
  
  /**
   * Adapter adı (debug için)
   */
  getName(): string;
  
  /**
   * Health check
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Storage Strategy - Hangi adapter'ın primary olduğunu belirler
 */
export type StorageStrategy = 
  | 'localStorage-primary'   // localStorage önce, Supabase backup
  | 'supabase-primary'       // Supabase önce, localStorage backup
  | 'localStorage-only'      // Sadece localStorage
  | 'supabase-only';         // Sadece Supabase

/**
 * Storage Config
 */
export interface StorageConfig {
  strategy: StorageStrategy;
  syncInterval?: number;      // Otomatik sync için interval (ms)
  retryAttempts?: number;     // Retry sayısı
  enableLogging?: boolean;    // Debug log'ları
}
