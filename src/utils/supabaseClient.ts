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
    
    // ✅ FIX: Parse JSONB strings back to objects when reading
    const parsedData = data.map(record => {
      const parsed = { ...record };
      
      // ✅ CRITICAL: linked_bank_pf_ids is TEXT[], not JSONB - already comes as array from Supabase
      // Don't try to parse it!
      
      // Parse JSONB string fields back to objects (NOT including linked_bank_pf_ids!)
      const jsonbFields = [
        'bank_device_assignments',
        'service_fee_settings',
        'device_subscriptions',
        'service_fee_invoices',
        'payment_reminders',
        'reminder_settings',
        'suspension_history',
        'domain_hierarchy'
      ];
      
      jsonbFields.forEach(field => {
        if (typeof parsed[field] === 'string') {
          try {
            parsed[field] = JSON.parse(parsed[field]);
          } catch (e) {
            console.warn(`⚠️ Failed to parse ${field}:`, e);
          }
        }
      });
      
      return parsed;
    });
    
    return { success: true, data: parsedData.map(objectToCamelCase) || [] };
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
    
    // ✅ FIX: Convert JSONB fields to JSON strings (Supabase requirement)
    const sanitizedRecords = records.map(record => {
      const sanitized = { ...record };
      
      // ✅ CRITICAL FIX: linked_bank_pf_ids is TEXT[] NOT JSONB!
      // Convert JSON string "[]" to actual PostgreSQL array format
      if (sanitized.linked_bank_pf_ids !== undefined && sanitized.linked_bank_pf_ids !== null) {
        // If it's a string like "[]" or "[...]", parse it first
        if (typeof sanitized.linked_bank_pf_ids === 'string') {
          try {
            sanitized.linked_bank_pf_ids = JSON.parse(sanitized.linked_bank_pf_ids);
          } catch (e) {
            console.warn('⚠️ Failed to parse linked_bank_pf_ids, using empty array');
            sanitized.linked_bank_pf_ids = [];
          }
        }
        // Now it should be an array - ensure it is
        if (!Array.isArray(sanitized.linked_bank_pf_ids)) {
          sanitized.linked_bank_pf_ids = [];
        }
      } else {
        // Default to empty array (not null!)
        sanitized.linked_bank_pf_ids = [];
      }
      
      // ✅ CRITICAL FIX: domain_hierarchy is also TEXT[] NOT JSONB!
      if (sanitized.domain_hierarchy !== undefined && sanitized.domain_hierarchy !== null) {
        if (typeof sanitized.domain_hierarchy === 'string') {
          try {
            sanitized.domain_hierarchy = JSON.parse(sanitized.domain_hierarchy);
          } catch (e) {
            console.warn('⚠️ Failed to parse domain_hierarchy, using empty array');
            sanitized.domain_hierarchy = [];
          }
        }
        if (!Array.isArray(sanitized.domain_hierarchy)) {
          sanitized.domain_hierarchy = [];
        }
      } else {
        sanitized.domain_hierarchy = [];
      }
      
      // List of JSONB fields that need stringification (NOT including linked_bank_pf_ids or domain_hierarchy!)
      const jsonbFields = [
        'bank_device_assignments',
        'service_fee_settings',
        'device_subscriptions',
        'service_fee_invoices',
        'payment_reminders',
        'reminder_settings',
        'suspension_history'
      ];
      
      // Convert each JSONB field to JSON string (or null)
      jsonbFields.forEach(field => {
        if (sanitized[field] !== undefined && sanitized[field] !== null) {
          // Only stringify if it's an object/array
          if (typeof sanitized[field] === 'object') {
            sanitized[field] = JSON.stringify(sanitized[field]);
          }
        } else {
          // Convert undefined to null for Postgres
          sanitized[field] = null;
        }
      });
      
      return sanitized;
    });
    
    // Debug: Log first record's keys to verify conversion
    if (sanitizedRecords.length > 0) {
      console.log('🔍 Sample record keys (snake_case):', Object.keys(sanitizedRecords[0]).slice(0, 10).join(', '));
      console.log('🔍 JSONB field sample (service_fee_settings):', 
        typeof sanitizedRecords[0].service_fee_settings === 'string' 
          ? 'STRING ✅' 
          : `OBJECT ❌ (${typeof sanitizedRecords[0].service_fee_settings})`
      );
    }
    
    // ✅ UPSERT: Insert new records or update existing ones (based on 'id')
    const { data, error } = await supabase
      .from('customers')
      .upsert(sanitizedRecords, { onConflict: 'id' })
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
      if (sanitizedRecords.length > 0) {
        console.error('🔍 First record causing error:', JSON.stringify(sanitizedRecords[0], null, 2));
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
    
    // ✅ FIX: Parse JSONB strings back to objects when reading
    const parsedData = data.map(record => {
      const parsed = { ...record };
      
      // ✅ CRITICAL: linked_bank_pf_ids is TEXT[], not JSONB - already comes as array from Supabase
      // Don't try to parse it!
      
      // Parse JSONB string fields back to objects (NOT including linked_bank_pf_ids!)
      const jsonbFields = [
        'bank_device_assignments',
        'service_fee_settings',
        'device_subscriptions',
        'service_fee_invoices',
        'payment_reminders',
        'reminder_settings',
        'suspension_history',
        'domain_hierarchy'
      ];
      
      jsonbFields.forEach(field => {
        if (typeof parsed[field] === 'string') {
          try {
            parsed[field] = JSON.parse(parsed[field]);
          } catch (e) {
            console.warn(`⚠️ Failed to parse ${field}:`, e);
          }
        }
      });
      
      return parsed;
    });
    
    return { success: true, data: parsedData.map(objectToCamelCase), count: data.length };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'kod' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.kod, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate MCC codes (by kod)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeMCCCode);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.kod, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate MCC codes AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique MCC codes to Supabase...`);
    
    const { data, error } = await supabase
      .from('mcc_codes')
      .upsert(finalItems, { onConflict: 'kod' })
      .select();

    if (error) {
      console.error('❌ Error upserting MCC codes:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} MCC codes in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting MCC code ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('mcc_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting MCC code:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted MCC code ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'kod' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.kod, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate banks (by kod)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeBank);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.kod, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate banks AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique banks to Supabase...`);
    
    const { data, error } = await supabase
      .from('banks')
      .upsert(finalItems, { onConflict: 'kod' })
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

  async delete(id: string) {
    console.log(`🗑️ Deleting bank ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('banks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting bank:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted bank ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'kod' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.kod, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate EPK (by kod)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeEPK);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.kod, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate EPK AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique EPK entries to Supabase...`);
    
    const { data, error } = await supabase
      .from('epk_institutions')
      .upsert(finalItems, { onConflict: 'kod' })
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

  async delete(id: string) {
    console.log(`🗑️ Deleting EPK entry ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('epk_institutions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting EPK entry:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted EPK entry ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'kod' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.kod, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate OK (by kod)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeOK);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.kod, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate OK AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique OK entries to Supabase...`);
    
    const { data, error } = await supabase
      .from('ok_institutions')
      .upsert(finalItems, { onConflict: 'kod' })
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

  async delete(id: string) {
    console.log(`🗑️ Deleting OK entry ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('ok_institutions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting OK entry:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted OK entry ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate partnerships (by id)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizePartnership);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate partnerships AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique partnerships to Supabase...`);
    
    const { data, error } = await supabase
      .from('partnerships')
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting partnerships:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} partnerships in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting partnership ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('partnerships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting partnership:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted partnership ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate sharings (by id)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeSharing);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate sharings AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique sharing records to Supabase...`);
    
    const { data, error } = await supabase
      .from('sharings') // ✅ FIXED: 'sharing' → 'sharings' (plural)
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting sharing records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} sharing records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting sharing record ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('sharings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting sharing record:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted sharing record ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate card programs (by id)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeKartProgram);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate card programs AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique kart program records to Supabase...`);
    
    const { data, error } = await supabase
      .from('card_programs') // ✅ FIXED: 'kart_program' → 'card_programs' (English + plural)
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting kart program records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} kart program records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting kart program ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('card_programs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting kart program:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted kart program ${id} from Supabase`);
    return { success: true };
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
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate suspension reasons (by id)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase).map(sanitizeSuspensionReason);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate suspension reasons AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique suspension reason records to Supabase...`);
    
    const { data, error } = await supabase
      .from('suspension_reasons') // ✅ FIXED: 'suspension_reason' → 'suspension_reasons' (plural)
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting suspension reason records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} suspension reason records in Supabase`);
    return { success: true, data: data.map(objectToCamelCase), count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting suspension reason ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('suspension_reasons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting suspension reason:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted suspension reason ${id} from Supabase`);
    return { success: true };
  },
};

// ========================================
// DUPLICATE CLEANUP API (SQL Functions)
// ========================================

export interface DuplicateCleanupResult {
  table_name: string;
  unique_field: string;
  deleted_count: number;
  kept_count: number;
  status: string;
}

/**
 * Calls Supabase cleanup_all_duplicates() function
 * This runs server-side duplicate cleanup for all tables
 */
export async function cleanupAllDuplicatesSQL(): Promise<{
  success: boolean;
  results?: DuplicateCleanupResult[];
  error?: string;
}> {
  try {
    console.log('🧹 Calling Supabase cleanup_all_duplicates() function...');
    
    const { data, error } = await supabase.rpc('cleanup_all_duplicates');
    
    if (error) {
      console.error('❌ SQL cleanup error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ SQL cleanup complete:', data);
    return { success: true, results: data };
  } catch (error: any) {
    console.error('❌ Exception in cleanupAllDuplicatesSQL:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Calls Supabase cleanup_duplicates() function for a specific table
 */
export async function cleanupTableDuplicatesSQL(
  tableName: string,
  uniqueColumn: string,
  keepStrategy: 'latest' | 'earliest' = 'latest'
): Promise<{
  success: boolean;
  deleted_count?: number;
  kept_count?: number;
  error?: string;
}> {
  try {
    console.log(`🧹 Cleaning duplicates in ${tableName}.${uniqueColumn}...`);
    
    const { data, error } = await supabase.rpc('cleanup_duplicates', {
      table_name: tableName,
      unique_column: uniqueColumn,
      keep_strategy: keepStrategy
    });
    
    if (error) {
      console.error(`❌ SQL cleanup error for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Cleaned ${tableName}:`, data);
    return { 
      success: true, 
      deleted_count: data[0]?.deleted_count || 0,
      kept_count: data[0]?.kept_count || 0
    };
  } catch (error: any) {
    console.error(`❌ Exception in cleanupTableDuplicatesSQL for ${tableName}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Checks for existing duplicates using duplicate_monitoring view
 */
export async function checkDuplicatesSQL(): Promise<{
  success: boolean;
  duplicates?: Array<{
    table_name: string;
    unique_field: string;
    duplicate_value: string;
    duplicate_count: number;
    duplicate_ids: string[];
  }>;
  error?: string;
}> {
  try {
    console.log('🔍 Checking for duplicates...');
    
    const { data, error } = await supabase
      .from('duplicate_monitoring')
      .select('*');
    
    if (error) {
      console.error('❌ Error checking duplicates:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`📊 Found ${data?.length || 0} duplicate groups`);
    return { success: true, duplicates: data || [] };
  } catch (error: any) {
    console.error('❌ Exception in checkDuplicatesSQL:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}