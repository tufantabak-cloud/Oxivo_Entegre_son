/**
Supabase Client ve API Helpers
Direct Supabase Client mode - Frontend'den direkt Postgres erişimi

IMPORTANT: Supabase uses snake_case, Frontend uses camelCase
All data is converted automatically via caseConverter

SINGLETON: Uses global window cache to prevent multiple instances
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ========================================
// CASE CONVERTER UTILITIES (Inline to avoid import issues)
// ========================================

/**
camelCase → snake_case dönüşümü
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
snake_case → camelCase dönüşümü
 */
function toCamelCase(str: string): string {
  return str.replace(/([a-z])/g, (, letter) => letter.toUpperCase());
}

/**
Object'in tüm key'lerini camelCase'den snake_case'e çevirir
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
Object'in tüm key'lerini snake_case'den camelCase'e çevirir
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
const SUPABASE_SINGLETON_KEY = 'oxivo_supabase_client';

// Declare global type
declare global {
  interface Window {
    [SUPABASE_SINGLETON_KEY]?: SupabaseClient;
  }
}

/**
Get or create Supabase client (singleton)
CRITICAL: This ensures only ONE instance exists globally
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
  (window as any).OXIVO_SUPABASE = supabase;
  console.log('🔍 Debug: Supabase client available at window.OXIVO_SUPABASE');
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
Tüm müşterileri getirir
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
Tek müşteri getirir
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
Müşteri ekler (tek veya toplu)
   */
  async create(customers: any | any[]) {
    console.log('📤 Upserting customers to Supabase...');
    
    const records = Array.isArray(customers) ? customers.map(objectToSnakeCase) : [objectToSnakeCase(customers)];
    
    console.log(`📤 Converting ${records.length} customers to snake_case...`);
    
    // Debug: Log first record's keys to verify conversion
    if (records.length > 0) {
      console.log('🔍 Sample record keys (snake_case):', Object.keys(records[0]).slice(0, 10).join(', '));
    }
    
    const { data, error } = await supabase
      .from('customers')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error creating customers:', error);
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
      } else if (error.code === '23505') {
        console.error('💡 Duplicate key! Some records may already exist');
      }
      
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} customers to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  /**
Müşteri günceller
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
Müşteri siler
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
Tüm ürünleri getirir
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
Ürün sync (upsert)
   */
  async sync(products: any[], strategy: 'merge' | 'replace' = 'merge') {
    if (strategy === 'replace') {
      // Önce tümünü sil
      await supabase.from('products').delete().neq('id', '');
    }

    // Upsert ile ekle/güncelle
    const { data, error } = await supabase
      .from('products')
      .upsert(products.map(objectToSnakeCase), { onConflict: 'serialNumber' })
      .select();

    if (error) {
      console.error('❌ Error syncing products:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Synced ${data.length} products to Supabase`);
    return {
      success: true,
      data: data.map(objectToCamelCase),
      stats: {
        total: data.length,
        added: products.length,
        updated: 0,
      },
    };
  },
};

// ========================================
// BANK/PF API
// ========================================

export const bankPFApi = {
  /**
Tüm Bank/PF kayıtlarını getirir
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
Bank/PF kayıtları ekler/günceller (upsert)
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records.map(objectToSnakeCase) : [objectToSnakeCase(records)];
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting bankPF records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} bankPF records to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// PETTY CASH API
// ========================================

export const pettyCashApi = {
  /**
Tüm Petty Cash kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('petty_cash')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching petty cash records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} petty cash records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
Petty Cash kayıtları ekler/günceller (upsert)
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records.map(objectToSnakeCase) : [objectToSnakeCase(records)];

    const { data, error } = await supabase
      .from('petty_cash')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting petty cash records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} petty cash records to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// CATEGORIES API
// ========================================

export const categoryApi = {
  /**
Tüm kategori kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching categories:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} categories from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
Kategori kayıtları ekler/günceller (upsert)
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records.map(objectToSnakeCase) : [objectToSnakeCase(records)];

    const { data, error } = await supabase
      .from('categories')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting categories:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} categories to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// TRANSACTIONS API
// ========================================

export const transactionApi = {
  /**
Tüm işlem kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} transactions from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
İşlem kayıtları ekler/günceller (upsert)
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records.map(objectToSnakeCase) : [objectToSnakeCase(records)];

    const { data, error } = await supabase
      .from('transactions')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting transactions:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} transactions to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// SIGNS (TABELA) API
// ========================================

export const signApi = {
  /**
Tüm tabela kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('signs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching signs:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} signs from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
Tabela kayıtları ekler/günceller (upsert)
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records.map(objectToSnakeCase) : [objectToSnakeCase(records)];

    const { data, error } = await supabase
      .from('signs')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting signs:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} signs to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// INCOME RECORDS API
// ========================================

export const incomeApi = {
  /**
Tüm gelir kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('income_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching income records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} income records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
Gelir kayıtları ekler/günceller (upsert)
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records.map(objectToSnakeCase) : [objectToSnakeCase(records)];

    const { data, error } = await supabase
      .from('income_records')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting income records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} income records to Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};