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
import { 
  sanitizeMCCCode, 
  sanitizeBank, 
  sanitizeEPK, 
  sanitizeOK, 
  sanitizeSalesRep, 
  sanitizeJobTitle, 
  sanitizePartnership,
  sanitizeAccountItem,
  sanitizeFixedCommission,
  sanitizeAdditionalRevenue,
  sanitizeSharing,
  sanitizeKartProgram,
  sanitizeSuspensionReason
} from './fieldSanitizer';

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
 * JSONB fields: Arrays and nested objects are properly handled
 */
export function objectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(item => objectToSnakeCase(item));
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    
    // ✅ FIX: Handle arrays and nested objects recursively
    if (value && typeof value === 'object') {
      converted[snakeKey] = objectToSnakeCase(value);
    } else {
      converted[snakeKey] = value;
    }
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

// ✅ SIMPLIFIED: Use hard-coded credentials (for Figma Make environment)
// These can be overridden via environment variables in production
export const PROJECT_ID = "okgeyuhmumlkkcpoholh";
export const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDAyMjAsImV4cCI6MjA3Mzk3NjIyMH0.wICqJoMc9a2-S7OwW6VMwcs1-ApPjpnS2QMZ4BVZFpI";

// Log credentials source for debugging
if (typeof window !== 'undefined') {
  console.log('🔧 Using Supabase credentials:', {
    projectId: PROJECT_ID,
    source: 'hard-coded (Figma Make environment)'
  });
}

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
    
    // Convert to array
    const customerArray = Array.isArray(customers) ? customers : [customers];
    
    // ✅ ADD TIMESTAMPS: Enrich each customer with createdAt/updatedAt if missing
    const enrichedCustomers = customerArray.map(customer => {
      const now = new Date().toISOString();
      return {
        ...customer,
        createdAt: customer.createdAt || now,
        updatedAt: now,
      };
    });
    
    // Convert to snake_case
    const records = enrichedCustomers.map(objectToSnakeCase);
    
    console.log(`📤 Converting ${records.length} customers to snake_case...`);
    
    // Debug: Log first record's keys to verify conversion
    if (records.length > 0) {
      console.log('🔍 Sample record keys (snake_case):', Object.keys(records[0]).slice(0, 10).join(', '));
      
      // 🔍 DEBUG: Log a sample record with device subscriptions (if exists)
      const sampleWithDevices = records.find(r => r.service_fee_settings?.device_subscriptions?.length > 0);
      if (sampleWithDevices) {
        console.log('🔍 Sample deviceSubscription:', JSON.stringify(sampleWithDevices.service_fee_settings?.device_subscriptions?.[0], null, 2));
      }
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
      
      // 🔍 DEBUG: Log problematic record
      if (records.length > 0) {
        console.error('🔍 First record causing error:', JSON.stringify(records[0], null, 2));
      }
      
      // Extra debugging for common errors
      if (error.code === 'PGRST204') {
        console.error('💡 Table not found! Run /SUPABASE_CUSTOMERS_FIX.sql in Supabase Dashboard');
      } else if (error.code === '42703') {
        console.error('💡 Column mismatch! Check that table schema matches Customer interface');
      } else if (error.code === '22P02') {
        console.error('💡 Invalid JSON syntax! Check JSONB fields (bankDeviceAssignments, serviceFeeSettings, etc.)');
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
    
    // Convert to array
    const productArray = Array.isArray(products) ? products : [products];
    
    // ✅ ADD TIMESTAMPS: Enrich each product with createdAt/updatedAt if missing
    const enrichedProducts = productArray.map(product => {
      const now = new Date().toISOString();
      return {
        ...product,
        createdAt: product.createdAt || now,
        updatedAt: now,
      };
    });
    
    // Convert to snake_case
    const records = enrichedProducts.map(objectToSnakeCase);
    
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
    
    // Convert to array
    const recordArray = Array.isArray(records) ? records : [records];
    
    // ✅ ADD TIMESTAMPS: Enrich each record with createdAt/updatedAt if missing
    const enrichedRecords = recordArray.map(record => {
      const now = new Date().toISOString();
      return {
        ...record,
        createdAt: record.createdAt || now,
        updatedAt: now,
      };
    });
    
    // Convert to snake_case
    const items = enrichedRecords.map(objectToSnakeCase);
    
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

// ========================================
// MCC CODES API
// ========================================

export const mccCodesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mcc_codes')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      console.error('❌ Error fetching MCC codes:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} MCC codes from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating MCC codes in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeMCCCode)
      : [sanitizeMCCCode(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} MCC codes to snake_case...`);
    
    const { data, error } = await supabase
      .from('mcc_codes')
      .upsert(items, { onConflict: 'kod' })
      .select();

    if (error) {
      console.error('❌ Error upserting MCC codes:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} MCC codes in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// BANKS API
// ========================================

export const banksApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('banks')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      console.error('❌ Error fetching banks:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} banks from Supabase`);
    // ✅ CRITICAL FIX: Map 'ad' → 'bankaAdi' for frontend compatibility
    const mappedData = data.map(item => {
      const camelItem = objectToCamelCase(item);
      if (camelItem.ad) {
        camelItem.bankaAdi = camelItem.ad;
      }
      return camelItem;
    });
    return { success: true, data: mappedData || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating banks in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeBank)
      : [sanitizeBank(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} banks to snake_case...`);
    
    const { data, error } = await supabase
      .from('banks')
      .upsert(items, { onConflict: 'kod' })
      .select();

    if (error) {
      console.error('❌ Error upserting banks:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} banks in Supabase`);
    // ✅ CRITICAL FIX: Map 'ad' → 'bankaAdi' for frontend compatibility
    const mappedData = data.map(item => {
      const camelItem = objectToCamelCase(item);
      if (camelItem.ad) {
        camelItem.bankaAdi = camelItem.ad;
      }
      return camelItem;
    });
    return { success: true, data: mappedData, count: data.length };
  },
};

// ========================================
// EPK LIST API
// ========================================

export const epkListApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('epk_institutions')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      console.error('❌ Error fetching EPK list:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} EPK entries from Supabase`);
    // ✅ CRITICAL FIX: Map 'ad' → 'kurumAdi' for frontend compatibility
    const mappedData = data.map(item => {
      const camelItem = objectToCamelCase(item);
      if (camelItem.ad) {
        camelItem.kurumAdi = camelItem.ad;
      }
      return camelItem;
    });
    return { success: true, data: mappedData || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating EPK entries in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeEPK)
      : [sanitizeEPK(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} EPK entries to snake_case...`);
    
    const { data, error } = await supabase
      .from('epk_institutions')
      .upsert(items, { onConflict: 'kod' })
      .select();

    if (error) {
      console.error('❌ Error upserting EPK list:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} EPK entries in Supabase`);
    // ✅ CRITICAL FIX: Map 'ad' → 'kurumAdi' for frontend compatibility
    const mappedData = data.map(item => {
      const camelItem = objectToCamelCase(item);
      if (camelItem.ad) {
        camelItem.kurumAdi = camelItem.ad;
      }
      return camelItem;
    });
    return { success: true, data: mappedData, count: data.length };
  },
};

// ========================================
// OK LIST API
// ========================================

export const okListApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('ok_institutions')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      console.error('❌ Error fetching OK list:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} OK entries from Supabase`);
    // ✅ CRITICAL FIX: Map 'ad' → 'kurumAdi' for frontend compatibility
    const mappedData = data.map(item => {
      const camelItem = objectToCamelCase(item);
      if (camelItem.ad) {
        camelItem.kurumAdi = camelItem.ad;
      }
      return camelItem;
    });
    return { success: true, data: mappedData || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating OK entries in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeOK)
      : [sanitizeOK(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} OK entries to snake_case...`);
    
    const { data, error } = await supabase
      .from('ok_institutions')
      .upsert(items, { onConflict: 'kod' })
      .select();

    if (error) {
      console.error('❌ Error upserting OK list:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} OK entries in Supabase`);
    // ✅ CRITICAL FIX: Map 'ad' → 'kurumAdi' for frontend compatibility
    const mappedData = data.map(item => {
      const camelItem = objectToCamelCase(item);
      if (camelItem.ad) {
        camelItem.kurumAdi = camelItem.ad;
      }
      return camelItem;
    });
    return { success: true, data: mappedData, count: data.length };
  },
};

// ========================================
// SALES REPRESENTATIVES API
// ========================================

export const salesRepsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales_representatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching sales reps:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} sales representatives from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating sales representatives in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeSalesRep)
      : [sanitizeSalesRep(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} sales reps to snake_case...`);
    
    const { data, error } = await supabase
      .from('sales_representatives')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting sales representatives:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} sales representatives in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// JOB TITLES API
// ========================================

export const jobTitlesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('job_titles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching job titles:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} job titles from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating job titles in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeJobTitle)
      : [sanitizeJobTitle(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} job titles to snake_case...`);
    
    const { data, error } = await supabase
      .from('job_titles')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting job titles:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} job titles in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// PARTNERSHIPS API
// ========================================

export const partnershipsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('partnerships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching partnerships:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} partnerships from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating partnerships in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizePartnership)
      : [sanitizePartnership(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} partnerships to snake_case...`);
    
    const { data, error } = await supabase
      .from('partnerships')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting partnerships:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} partnerships in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// ACCOUNT ITEMS API
// ========================================

export const accountItemsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('account_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching account items:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} account items from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating account items in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeAccountItem)
      : [sanitizeAccountItem(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} account items to snake_case...`);
    
    const { data, error } = await supabase
      .from('account_items')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting account items:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} account items in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// FIXED COMMISSIONS API
// ========================================

export const fixedCommissionsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('fixed_commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching fixed commissions:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} fixed commissions from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating fixed commissions in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeFixedCommission)
      : [sanitizeFixedCommission(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} fixed commissions to snake_case...`);
    
    const { data, error } = await supabase
      .from('fixed_commissions')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting fixed commissions:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} fixed commissions in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// ADDITIONAL REVENUES API
// ========================================

export const additionalRevenuesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('additional_revenues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching additional revenues:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} additional revenues from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating additional revenues in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeAdditionalRevenue)
      : [sanitizeAdditionalRevenue(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} additional revenues to snake_case...`);
    
    const { data, error } = await supabase
      .from('additional_revenues')
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting additional revenues:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} additional revenues in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// SHARING API
// ========================================

export const sharingApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('sharings') // ✅ FIXED: 'sharing' → 'sharings' (plural)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching sharing records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} sharing records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating sharing records in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeSharing)
      : [sanitizeSharing(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} sharing records to snake_case...`);
    
    const { data, error } = await supabase
      .from('sharings') // ✅ FIXED: 'sharing' → 'sharings' (plural)
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting sharing records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} sharing records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// KART PROGRAM API
// ========================================

export const kartProgramApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('card_programs') // ✅ FIXED: 'kart_program' → 'card_programs' (English + plural)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching kart program records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} kart program records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating kart program records in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeKartProgram)
      : [sanitizeKartProgram(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} kart program records to snake_case...`);
    
    const { data, error } = await supabase
      .from('card_programs') // ✅ FIXED: 'kart_program' → 'card_programs' (English + plural)
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting kart program records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} kart program records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};

// ========================================
// SUSPENSION REASON API
// ========================================

export const suspensionReasonApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('suspension_reasons') // ✅ FIXED: 'suspension_reason' → 'suspension_reasons' (plural)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching suspension reason records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} suspension reason records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating suspension reason records in Supabase...');
    
    const items = Array.isArray(records) 
      ? records.map(objectToSnakeCase).map(sanitizeSuspensionReason)
      : [sanitizeSuspensionReason(objectToSnakeCase(records))];
    
    console.log(`📤 Converting & sanitizing ${items.length} suspension reason records to snake_case...`);
    
    const { data, error } = await supabase
      .from('suspension_reasons') // ✅ FIXED: 'suspension_reason' → 'suspension_reasons' (plural)
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting suspension reason records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} suspension reason records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },
};