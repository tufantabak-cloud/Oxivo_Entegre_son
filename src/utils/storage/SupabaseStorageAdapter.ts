/**
 * Supabase Storage Adapter
 * Supabase Edge Functions (Hono API) kullanan implementation
 * 
 * Created: 2025-11-17
 */

import { StorageAdapter } from './StorageAdapter';
import { logger } from '../logger';
import { projectId, publicAnonKey } from '../supabase/info'; // ✅ FIX: Correct path

export class SupabaseStorageAdapter implements StorageAdapter {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9ec5bbb3`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    };
  }

  getName(): string {
    return 'Supabase';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const endpoint = this.getEndpointForKey(key);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      logger.error('SupabaseStorageAdapter: get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const endpoint = this.getEndpointForKey(key);
      const body = this.prepareBody(key, value);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      logger.error('SupabaseStorageAdapter: set error', { key, error });
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const endpoint = this.getEndpointForKey(key);
      
      // DELETE endpoint yoksa, boş array set et
      await this.set(key, [] as any);
      
      logger.info('SupabaseStorageAdapter: removed (set to empty)', { key });
    } catch (error) {
      logger.error('SupabaseStorageAdapter: remove error', { key, error });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Tüm endpoint'leri temizle
      const endpoints = ['/customers', '/products', '/domains', '/bankpf'];
      
      await Promise.all(
        endpoints.map(endpoint =>
          fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(this.prepareBody(endpoint, [])),
          })
        )
      );
      
      logger.info('SupabaseStorageAdapter: cleared all data');
    } catch (error) {
      logger.error('SupabaseStorageAdapter: clear error', { error });
      throw error;
    }
  }

  async getByPrefix<T>(prefix: string): Promise<Record<string, T>> {
    try {
      const result: Record<string, T> = {};
      
      // Prefix'e göre endpoint belirle ve tüm veriyi çek
      const mappings = this.getPrefixMappings();
      
      for (const [keyPrefix, endpoint] of Object.entries(mappings)) {
        if (prefix.startsWith(keyPrefix) || keyPrefix.startsWith(prefix)) {
          const data = await this.get<T>(keyPrefix);
          if (data !== null) {
            result[keyPrefix] = data;
          }
        }
      }
      
      return result;
    } catch (error) {
      logger.error('SupabaseStorageAdapter: getByPrefix error', { prefix, error });
      return {};
    }
  }

  async keys(): Promise<string[]> {
    // Bilinen key'leri döndür
    return Object.keys(this.getPrefixMappings());
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers,
      });
      
      if (!response.ok) return false;
      
      const result = await response.json();
      return result.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Key'e göre doğru endpoint'i belirle
   */
  private getEndpointForKey(key: string): string {
    if (key === 'customers') return '/customers';
    if (key === 'payterProducts') return '/products';
    if (key === 'domains') return '/domains';
    if (key === 'bankPFRecords') return '/bankpf';
    
    // Definitions ve diğer veriler için generic KV endpoint
    // (Şimdilik localStorage'da kalabilir)
    throw new Error(`No Supabase endpoint for key: ${key}`);
  }

  /**
   * Key'e göre request body'yi hazırla
   */
  private prepareBody(key: string, value: any): any {
    if (key === 'customers') {
      return {
        customers: Array.isArray(value) ? value : [],
        strategy: 'replace',
      };
    }
    
    if (key === 'payterProducts') {
      return {
        products: Array.isArray(value) ? value : [],
        source: 'manual',
        strategy: 'replace',
      };
    }
    
    if (key === 'domains') {
      return {
        domains: Array.isArray(value) ? value : [],
      };
    }
    
    if (key === 'bankPFRecords') {
      return {
        records: Array.isArray(value) ? value : [],
      };
    }
    
    throw new Error(`Cannot prepare body for key: ${key}`);
  }

  /**
   * Prefix → Endpoint mapping
   */
  private getPrefixMappings(): Record<string, string> {
    return {
      'customers': '/customers',
      'payterProducts': '/products',
      'domains': '/domains',
      'bankPFRecords': '/bankpf',
    };
  }
}