/**
 * Supabase Client ve API Helpers
 * Direct Supabase Client mode - Frontend'den direkt Postgres erişimi
 * 
 * IMPORTANT: Supabase uses snake_case, Frontend uses camelCase
 * All data is converted automatically via caseConverter
 * 
 * SINGLETON: Uses global window cache to prevent multiple instances
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ========================================
// CASE CONVERTER UTILITIES (Inline to avoid import issues)
// ========================================

/**
 * camelCase → snake_case dönüşümü
 * FIXED: Handles consecutive capitals (e.g., "linkedBankPFIds" → "linked_bank_pf_ids")
 */
function toSnakeCase(str: string): string {
  return str
    // Insert underscore before uppercase letter that follows a lowercase letter
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    // Insert underscore before uppercase letter that follows another uppercase letter and is followed by lowercase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * snake_case → camelCase dönüşümü
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Object'in tüm key'lerini camelCase'den snake_case'e çevirir
 */
export function objectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(item => objectToSnakeCase(item));
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    converted[snakeKey] = (value && typeof value === 'object') 
      ? objectToSnakeCase(value) 
      : value;
  }
  return converted;
}

/**
 * Object'in tüm key'lerini snake_case'den camelCase'e çevirir
 */
export function objectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(item => objectToCamelCase(item));
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    converted[camelKey] = (value && typeof value === 'object') 
      ? objectToCamelCase(value) 
      : value;
  }
  return converted;
}

// ========================================
// SUPABASE CLIENT CONFIGURATION
// ========================================

// Correct project info - Updated to okgeyuhmumlkkcpoholh
export const PROJECT_ID = "okgeyuhmumlkkcpoholh";
export const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDAyMjAsImV4cCI6MjA3Mzk3NjIyMH0.wICqJoMc9a2-S7OwW6VMwcs1-ApPjpnS2QMZ4BVZFpI";

// Global singleton cache key
const SUPABASE_SINGLETON_KEY = '__oxivo_supabase_client__';

// Declare global type
declare global {
  interface Window {
    [SUPABASE_SINGLETON_KEY]?: SupabaseClient;
  }
}

/**
 * Get or create Supabase client (singleton)
 * CRITICAL: This ensures only ONE instance exists globally
 */
function getSupabaseClient(): SupabaseClient {
  // Server-side: create new client (no window)
  if (typeof window === 'undefined') {
    return createClient(`https://${PROJECT_ID}.supabase.co`, ANON_KEY);
  }

  // Client-side: check if already exists in window
  if (!window[SUPABASE_SINGLETON_KEY]) {
    console.log('🔧 Creating new Supabase client singleton...');
    
    window[SUPABASE_SINGLETON_KEY] = createClient(
      `https://${PROJECT_ID}.supabase.co`,
      ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Disable to prevent conflicts
          storage: window.localStorage,
          storageKey: 'sb-okgeyuhmumlkkcpoholh-auth-token',
        },
        global: {
          headers: {
            'X-Client-Info': 'oxivo-app-v1',
          },
        },
        db: {
          schema: 'public',
        },
      }
    );
    
    console.log('✅ Supabase client singleton created');
  } else {
    console.log('♻️ Reusing existing Supabase client singleton');
  }

  return window[SUPABASE_SINGLETON_KEY]!;
}

// Export singleton client
export const supabase = getSupabaseClient();

// Debug: Expose client to window for inspection
if (typeof window !== 'undefined') {
  (window as any).__OXIVO_SUPABASE__ = supabase;
  console.log('🔍 Debug: Supabase client available at window.__OXIVO_SUPABASE__');
}

// HMR (Hot Module Replacement) cleanup
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clean up on HMR reload to prevent stale instances
    console.log('🧹 Cleaning up Supabase client on HMR...');
    if (typeof window !== 'undefined' && window[SUPABASE_SINGLETON_KEY]) {
      // Note: We keep the singleton for consistent auth state
      // but log the cleanup for debugging
    }
  });
}

// ========================================
// CUSTOMER API
// ========================================

export const customerApi = {
  /**
   * Tüm müşterileri getirir
   */
  async getAll() {
    console.log('🔍 Fetching customers from Supabase...');
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customers:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} customers from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
   * Tek müşteri getirir
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: objectToCamelCase(data) };
  },

  /**
   * Müşteri ekler (tek veya toplu)
   */
  async create(customers: any | any[]) {
    console.log('📤 Creating customers in Supabase...');
    
    // Convert to array and snake_case
    const records = Array.isArray(customers) 
      ? customers.map(objectToSnakeCase) 
      : [objectToSnakeCase(customers)];
    
    console.log(`📤 Converting ${records.length} customers to snake_case...`);
    
    // Debug: Log first record's keys to verify conversion
    if (records.length > 0) {
      console.log('🔍 Sample record keys (snake_case):', Object.keys(records[0]).slice(0, 10).join(', '));
    }
    
    // ✅ UPSERT: Insert new records or update existing ones (based on 'id')
    const { data, error } = await supabase
      .from('customers')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting customers:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Extra debugging for common errors
      if (error.code === 'PGRST204') {
        console.error('💡 Table not found! Run /SUPABASE_CUSTOMERS_FIX.sql in Supabase Dashboard');
      } else if (error.code === '42703') {
        console.error('💡 Column mismatch! Check that table schema matches Customer interface');
      }
      
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} customers in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  /**
   * Müşteri günceller
   */
  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('customers')
      .update(objectToSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating customer:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Updated customer ${id} in Supabase`);
    return { success: true, data: objectToCamelCase(data) };
  },

  /**
   * Müşteri siler
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting customer:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted customer ${id} from Supabase`);
    return { success: true };
  },
};

// ========================================
// PRODUCT API
// ========================================

export const productApi = {
  /**
   * Tüm ürünleri getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} products from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
   * Ürün ekler (UPSERT)
   */
  async create(products: any | any[]) {
    console.log('📤 Creating products in Supabase...');
    
    // Convert to array and snake_case
    const records = Array.isArray(products) 
      ? products.map(objectToSnakeCase) 
      : [objectToSnakeCase(products)];
    
    console.log(`📤 Converting ${records.length} products to snake_case...`);
    
    // ✅ UPSERT: Insert new records or update existing ones (based on 'id')
    const { data, error } = await supabase
      .from('products')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting products:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} products in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  /**
   * Ürün sync (upsert) - LEGACY
   */
  async sync(products: any[], strategy: 'merge' | 'replace' = 'merge') {
    if (strategy === 'replace') {
      // Önce tümünü sil
      await supabase.from('products').delete().neq('id', '');
    }

    // Use create method (which uses UPSERT)
    return this.create(products);
  },
};

// ========================================
// BANK/PF API
// ========================================

export const bankPFApi = {
  /**
   * Tüm Bank/PF kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching bankPF records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} bankPF records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
   * Bank/PF kayıtları ekler (UPSERT)
   */
  async create(records: any | any[]) {
    console.log('📤 Creating bankPF records in Supabase...');
    
    // Convert to array and snake_case
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase)
      : [objectToSnakeCase(records)];
    
    console.log(`📤 Converting ${items.length} bankPF records to snake_case...`);
    
    // ✅ UPSERT: Insert new records or update existing ones (based on 'id')
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting bankPF records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} bankPF records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};
