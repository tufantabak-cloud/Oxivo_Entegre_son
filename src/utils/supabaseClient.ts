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
import { isFigmaMakeEnvironment } from './environmentDetection';

// ========================================
// CASE CONVERTER UTILITIES (Inline to avoid import issues)
// ========================================

/**
 * camelCase → snake_case dönüşümü
 * ✅ Türkçe karakterleri İngilizce ASCII karşılığına çevir (Database'de ASCII kullanılıyor)
 * Örnek: bankIds → bank_ids, yurtIciDisi → yurt_ici_disi
 */
function toSnakeCase(str: string): string {
  return str
    // ✅ STEP 1: Türkçe karakterleri İngilizce ASCII karşılığına çevir (toLowerCase ÖNCE!)
    .replace(/İ/g, 'I')   // Türkçe İ → İngilizce I
    .replace(/ı/g, 'i')   // Türkçe ı → İngilizce i
    .replace(/Ö/g, 'O')   // Türkçe Ö → İngilizce O
    .replace(/ö/g, 'o')   // Türkçe ö → İngilizce o
    .replace(/Ü/g, 'U')   // Türkçe Ü → İngilizce U
    .replace(/ü/g, 'u')   // Türkçe ü → İngilizce u
    .replace(/Ş/g, 'S')   // Türkçe Ş → İngilizce S
    .replace(/ş/g, 's')   // Türkçe ş → İngilizce s
    .replace(/Ğ/g, 'G')   // Türkçe Ğ → İngilizce G
    .replace(/ğ/g, 'g')   // Türkçe ğ → İngilizce g
    .replace(/Ç/g, 'C')   // Türkçe Ç → İngilizce C
    .replace(/ç/g, 'c')   // Türkçe ç → İngilizce c
    // ✅ STEP 2: Underscore ekle (artık sadece İngilizce karakterler var)
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    // ✅ STEP 3: Tümünü küçük harfe çevir
    .toLowerCase();
}

/**
 * snake_case → camelCase dönüşümü
 * ✅ Türkçe karakter desteği: ı→I, i→I, ö→Ö, ü→Ü, ş→Ş, ğ→Ğ, ç→Ç
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-zıöüşğç])/g, (_, letter) => {
    // Türkçe ve İngilizce karakterler için doğru mapping
    const upperMap: { [key: string]: string } = {
      'ı': 'I',  // Türkçe ı → I (komisyon_oranları → komisyonOranları)
      'i': 'I',  // İngilizce i → I (record_ids → recordIds)
      'ö': 'Ö',  // Türkçe ö → Ö
      'ü': 'Ü',  // Türkçe ü → Ü
      'ş': 'Ş',  // Türkçe ş → Ş
      'ğ': 'Ğ',  // Türkçe ğ → Ğ
      'ç': 'Ç'   // Türkçe ç → Ç
    };
    return upperMap[letter] || letter.toUpperCase();
  });
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
 * FIXED: Deep conversion for nested objects and arrays
 */
export function objectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => objectToCamelCase(item));
  }
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

// ✅ Detect Figma Make environment
// ✅ Disable Supabase in Figma Make environment (CORS restrictions)
const SUPABASE_ENABLED = !isFigmaMakeEnvironment();

if (isFigmaMakeEnvironment()) {
  console.log('🎨 Figma Make environment detected - Supabase disabled, using localStorage only');
}

// ✅ SIMPLIFIED: Use hard-coded credentials (for Figma Make environment)
// These can be overridden via environment variables in production
export const PROJECT_ID = "okgeyuhmumlkkcpoholh";
export const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDAyMjAsImV4cCI6MjA3Mzk3NjIyMH0.wICqJoMc9a2-S7OwW6VMwcs1-ApPjpnS2QMZ4BVZFpI";

// Log credentials source for debugging
if (typeof window !== 'undefined' && SUPABASE_ENABLED) {
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
function getSupabaseClient(): SupabaseClient | null {
  // ✅ Figma Make: Skip Supabase entirely (CORS blocked)
  if (isFigmaMakeEnvironment()) {
    return null;
  }

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

/**
 * Helper to wrap Supabase calls with Figma Make detection
 */
async function safeSupabaseCall<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'Supabase operation'
): Promise<T> {
  if (!SUPABASE_ENABLED) {
    // Silent in Figma Make (no spam)
    return fallbackValue;
  }

  try {
    return await operation();
  } catch (error: any) {
    // Only log errors if NOT in Figma Make
    if (!isFigmaMakeEnvironment()) {
      console.warn(`⚠️ ${operationName} failed:`, error.message);
    }
    return fallbackValue;
  }
}

/**
 * Error logger that respects silent mode (Figma Make)
 */
function logError(message: string, error?: any) {
  if (!isFigmaMakeEnvironment()) {
    console.error(message, error || '');
  }
}

/**
 * Check if Supabase is available
 * Returns fallback response if not available
 */
function checkSupabase() {
  if (!supabase) {
    // Silent in Figma Make
    return { available: false, fallback: { success: false, error: 'Supabase not available', data: [] } };
  }
  return { available: true, fallback: null };
}

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
    // ✅ Skip Supabase in Figma Make environment
    if (!SUPABASE_ENABLED) {
      console.log('⏭️ Skipping Supabase fetch (Figma Make environment)');
      return { success: false, error: 'Supabase disabled in Figma Make', data: [] };
    }

    console.log('🔍 Fetching customers from Supabase...');
    
    let data, error;
    try {
      const result = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    } catch (fetchError: any) {
      console.warn('⚠️ Supabase fetch failed, falling back to localStorage');
      return { 
        success: false, 
        error: 'Supabase unavailable',
        data: [] 
      };
    }

    if (error) {
      console.warn('⚠️ Supabase error, falling back to localStorage:', error.message);
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
            console.error(`❌ [getAll] Failed to parse ${field}:`, e);
            console.error(`❌ Error message:`, (e as Error).message);
            console.error(`❌ Invalid JSON preview (first 500):`, parsed[field]?.substring(0, 500));
            console.error(`❌ Invalid JSON preview (last 500):`, parsed[field]?.substring(Math.max(0, parsed[field].length - 500)));
            if (parsed[field]?.length > 50000) {
              console.error(`⚠️ WARNING: JSON string is very large (${parsed[field].length} chars) - might be corrupted or truncated!`);
            }
            // Set to null to avoid breaking the app
            parsed[field] = null;
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
    let data, error;
    try {
      const result = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      data = result.data;
      error = result.error;
    } catch (fetchError: any) {
      console.error('❌ Network error during Supabase fetch:', fetchError);
      return { 
        success: false, 
        error: 'Supabase bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.' 
      };
    }

    if (error) {
      logError('Error fetching customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: objectToCamelCase(data) };
  },

  /**
   * Müşteri ekler (tek veya toplu)
   */
  async create(customers: any | any[]) {
    console.log('📤 Creating customers in Supabase...');
    
    try {
      // Convert to array
      const customerArray = Array.isArray(customers) ? customers : [customers];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(customerArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < customerArray.length) {
      console.warn(`⚠️ Step 1: Removed ${customerArray.length - uniqueRecords.length} duplicate customers (by id)`);
    }
    
    // ✅ ADD TIMESTAMPS: Enrich each customer with createdAt/updatedAt if missing
    const enrichedCustomers = uniqueRecords.map(customer => {
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
      
      // Helper function to clean invalid UTF8 sequences
      const cleanUTF8 = (str: string): string => {
        if (!str || typeof str !== 'string') return str;
        // Remove control characters (0x00-0x1F) except newline, tab, carriage return
        // Also remove DEL (0x7F) and C1 control codes (0x80-0x9F)
        return str
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          // Replace problematic byte sequences that might not be valid UTF8
          .replace(/\uFFFD/g, ''); // Replace replacement character
      };
      
      // 🔧 CLEAN ALL STRING FIELDS (not just JSONB) to prevent UTF8 errors
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = cleanUTF8(sanitized[key]);
        }
      });
      
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
          try {
            let jsonData;
            
            // ✅ FIX: Parse JSON FIRST, then clean the object (not the JSON string!)
            if (typeof sanitized[field] === 'string') {
              // DON'T clean the JSON string itself - it will break the structure!
              // Parse it first, then clean the object values
              try {
                jsonData = JSON.parse(sanitized[field]);
              } catch (parseError) {
                // If direct parse fails, try cleaning ONLY control chars (not structure)
                console.warn(`⚠️ First parse attempt failed for ${field}, trying with minimal cleaning...`);
                const minimalClean = sanitized[field]
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Keep \n (0x0A) and \r (0x0D)
                  .replace(/\uFFFD/g, '');
                jsonData = JSON.parse(minimalClean);
              }
            } else {
              // It's already an object/array
              jsonData = sanitized[field];
            }
            
            // ✅ Now recursively clean all STRING VALUES in the object (not keys, not structure)
            const cleanObject = (obj: any): any => {
              if (typeof obj === 'string') {
                return cleanUTF8(obj);
              } else if (Array.isArray(obj)) {
                return obj.map(cleanObject);
              } else if (obj !== null && typeof obj === 'object') {
                const cleaned: any = {};
                for (const [key, value] of Object.entries(obj)) {
                  cleaned[key] = cleanObject(value);
                }
                return cleaned;
              }
              return obj;
            };
            
            const cleanedData = cleanObject(jsonData);
            
            // ✅ Use JSON.stringify with circular reference and size limit handling
            try {
              const seen = new WeakSet();
              const jsonString = JSON.stringify(cleanedData, (key, value) => {
                // Handle circular references
                if (typeof value === 'object' && value !== null) {
                  if (seen.has(value)) {
                    console.warn(`⚠️ Circular reference detected in ${field}.${key}, skipping...`);
                    return '[Circular Reference]';
                  }
                  seen.add(value);
                }
                return value;
              });
              
              // Check size before assigning (disabled to prevent warnings)
              // if (jsonString.length > 100000) {
              //   console.warn(`⚠️ Large JSONB field: ${field} (${Math.round(jsonString.length / 1024)}KB)`);
              // }
              
              sanitized[field] = jsonString;
            } catch (stringifyError) {
              console.error(`❌ JSON.stringify failed for ${field}:`, stringifyError);
              throw stringifyError; // Re-throw to be caught by outer catch
            }
            
          } catch (e) {
            console.error(`❌ Failed to parse ${field}:`, e);
            console.error(`❌ Error message:`, (e as Error).message);
            console.error(`❌ Value type:`, typeof sanitized[field]);
            if (typeof sanitized[field] === 'string') {
              console.error(`❌ JSON preview (first 500 chars):`, sanitized[field].substring(0, 500));
              console.error(`❌ JSON preview (last 500 chars):`, sanitized[field].substring(Math.max(0, sanitized[field].length - 500)));
              // Check if it's truncated
              if (sanitized[field].length > 50000) {
                console.error(`⚠️ WARNING: JSON string is very large (${sanitized[field].length} chars) - might be truncated!`);
              }
            }
            sanitized[field] = null;
          }
        } else {
          // Convert undefined to null for Postgres
          sanitized[field] = null;
        }
      });
      
      return sanitized;
    });
    
    // Debug: Log first record's keys to verify conversion (disabled)
    // if (sanitizedRecords.length > 0) {
    //   console.log('🔍 Sample record keys (snake_case):', Object.keys(sanitizedRecords[0]).slice(0, 10).join(', '));
    // }
    
    // ✅ BATCH UPSERT: Process in chunks to avoid timeout
    const BATCH_SIZE = 50; // Smaller batches for customers (they have large JSONB fields)
    const batches = [];
    
    for (let i = 0; i < sanitizedRecords.length; i += BATCH_SIZE) {
      batches.push(sanitizedRecords.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${sanitizedRecords.length} customers in ${batches.length} batches...`);
    
    let totalUpserted = 0;
    const allData: any[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📤 Batch ${i + 1}/${batches.length}: Upserting ${batch.length} customers...`);
      
      let data, error;
      try {
        const result = await supabase
          .from('customers')
          .upsert(batch, { onConflict: 'id' })
          .select();
        data = result.data;
        error = result.error;
      } catch (fetchError: any) {
        console.error(`❌ Network error during batch ${i + 1}:`, fetchError);
        return { 
          success: false, 
          error: 'Supabase bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.' 
        };
      }

      if (error) {
        console.error(`❌ Error upserting batch ${i + 1}/${batches.length}:`, error);
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
        } else if (error.code === '22P02') {
          console.error('💡 Invalid JSON syntax! Check JSONB fields (bankDeviceAssignments, serviceFeeSettings, etc.)');
        } else if (error.message.includes('UTF8') || error.message.includes('encoding')) {
          console.error('💡 UTF8 encoding error! Check for invalid characters in string fields');
        }
        
        return { success: false, error: `Batch ${i + 1} failed: ${error.message}` };
      }
      
      totalUpserted += data.length;
      allData.push(...data);
      console.log(`✅ Batch ${i + 1}/${batches.length}: ${data.length} customers upserted (Total: ${totalUpserted}/${sanitizedRecords.length})`);
    }

    console.log(`✅ All batches completed! Total upserted: ${totalUpserted} customers`);
    const data = allData;
    
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
            console.error(`❌ [create] Failed to parse ${field}:`, e);
            console.error(`❌ Error message:`, (e as Error).message);
            console.error(`❌ Invalid JSON preview (first 500):`, parsed[field]?.substring(0, 500));
            console.error(`❌ Invalid JSON preview (last 500):`, parsed[field]?.substring(Math.max(0, parsed[field].length - 500)));
            if (parsed[field]?.length > 50000) {
              console.error(`⚠️ WARNING: JSON string is very large (${parsed[field].length} chars) - might be corrupted or truncated!`);
            }
            // Set to null to avoid breaking the app
            parsed[field] = null;
          }
        }
      });
      
      return parsed;
    });
    
    return { success: true, data: parsedData.map(objectToCamelCase), count: data.length };
    
    } catch (outerError: any) {
      console.error('❌ Unexpected error in customerApi.create:', outerError);
      return { 
        success: false, 
        error: outerError.message || 'Müşteri oluşturulurken beklenmeyen bir hata oluştu.' 
      };
    }
  },

  /**
   * Müşteri günceller
   */
  async update(id: string, updates: any) {
    let data, error;
    try {
      const result = await supabase
        .from('customers')
        .update(objectToSnakeCase(updates))
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } catch (fetchError: any) {
      console.error('❌ Network error during Supabase fetch:', fetchError);
      return { 
        success: false, 
        error: 'Supabase bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.' 
      };
    }

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
    let error;
    try {
      const result = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      error = result.error;
    } catch (fetchError: any) {
      console.error('❌ Network error during Supabase fetch:', fetchError);
      return { 
        success: false, 
        error: 'Supabase bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.' 
      };
    }

    if (error) {
      console.error('❌ Error deleting customer:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted customer ${id} from Supabase`);
    return { success: true };
  },

  /**
   * Müşteri ekler veya günceller (alias for create)
   * create() metodu zaten upsert kullanıyor
   */
  async upsert(customers: any | any[]) {
    return this.create(customers);
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
    // ✅ Skip Supabase in Figma Make environment
    if (!SUPABASE_ENABLED) {
      console.log('⏭️ Skipping products fetch (Figma Make environment)');
      return { success: false, error: 'Supabase disabled', data: [] };
    }

    try {
      // ✅ FIX: Supabase'in 1000 kayıt limitini aşmak için pagination
      let allProducts: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error, count } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.warn('⚠️ Error fetching products, falling back to localStorage');
          return { success: false, error: error.message, data: [] };
        }

        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          console.log(`✅ Fetched page ${page + 1}: ${data.length} products (total: ${allProducts.length}/${count})`);
        }

        // Daha fazla veri var mı?
        hasMore = data && data.length === pageSize;
        page++;

        // Güvenlik: Maksimum 10 sayfa (10,000 kayıt)
        if (page >= 10) {
          console.warn('⚠️ Reached maximum page limit (10). Some products may not be loaded.');
          break;
        }
      }

      console.log(`✅ Fetched total ${allProducts.length} products from Supabase`);
      return { success: true, data: allProducts.map(objectToCamelCase) || [] };
    } catch (error: any) {
      console.warn('⚠️ Products fetch failed, falling back to localStorage');
      return { success: false, error: 'Supabase unavailable', data: [] };
    }
  },

  /**
   * Ürün ekler (UPSERT)
   */
  async create(products: any | any[]) {
    console.log('📤 Creating products in Supabase...');
    
    // Convert to array
    const productArray = Array.isArray(products) ? products : [products];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(productArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < productArray.length) {
      // ✅ FIX: Changed to debug log (not warning) - this is expected behavior
      const duplicateCount = productArray.length - uniqueRecords.length;
      console.log(`🔄 Deduplicated ${duplicateCount} product(s) before sync (${productArray.length} → ${uniqueRecords.length})`);
    }
    
    // ✅ ADD TIMESTAMPS: Enrich each product with createdAt/updatedAt if missing
    const enrichedProducts = uniqueRecords.map(product => {
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
    
    // Auto-sanitize: Convert any object/array fields to JSON strings (if needed)
    
    const sanitizedRecords = records.map(record => {
      const sanitized = { ...record };
      
      Object.keys(sanitized).forEach(key => {
        const value = sanitized[key];
        
        // If value is an object or array (but not null/undefined), stringify it
        if (value !== null && value !== undefined && typeof value === 'object') {
          try {
            sanitized[key] = JSON.stringify(value);
          } catch (e) {
            console.error(`❌ Failed to stringify field '${key}':`, e);
            sanitized[key] = null; // Fallback to null
          }
        }
      });
      
      return sanitized;
    });
    
    // ✅ BATCH UPSERT: Process in chunks to avoid timeout
    const BATCH_SIZE = 100; // Reduced from unlimited to 100 records per batch
    const batches = [];
    
    for (let i = 0; i < sanitizedRecords.length; i += BATCH_SIZE) {
      batches.push(sanitizedRecords.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${sanitizedRecords.length} products in ${batches.length} batches...`);
    
    let totalUpserted = 0;
    const allData: any[] = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📤 Batch ${i + 1}/${batches.length}: Upserting ${batch.length} products...`);
      
      const { data, error } = await supabase
        .from('products')
        .upsert(batch, { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`❌ Error upserting batch ${i + 1}/${batches.length}:`, error);
        console.error('🔍 Error details:', {
          message: error.message,
          hint: error.hint,
          details: error.details,
          code: error.code
        });
        console.error('🔍 Failed record sample (sanitized):', batch[0]);
        return { success: false, error: `Batch ${i + 1} failed: ${error.message}` };
      }
      
      totalUpserted += data.length;
      allData.push(...data);
      console.log(`✅ Batch ${i + 1}/${batches.length}: ${data.length} products upserted (Total: ${totalUpserted}/${sanitizedRecords.length})`);
    }

    console.log(`✅ All batches completed! Total upserted: ${totalUpserted} products`);
    return { success: true, data: allData.map(objectToCamelCase), count: totalUpserted };
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching bankPF records:', error);
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
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordArray.length - uniqueRecords.length} duplicate bankPF records (by id)`);
    }
    
    // ✅ ADD TIMESTAMPS: Enrich each record with createdAt/updatedAt if missing
    const enrichedRecords = uniqueRecords.map(record => {
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

  /**
   * Bank/PF kaydı siler
   */
  async delete(id: string) {
    console.log(`🗑️ Deleting bankPF record ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting bankPF record:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted bankPF record ${id} from Supabase`);
    return { success: true };
  },

  /**
   * Bank/PF kaydı ekler veya günceller (alias for create)
   * create() metodu zaten upsert kullanıyor
   */
  async upsert(records: any | any[]) {
    return this.create(records);
  },
};

// ========================================
// MCC CODES API
// ========================================

export const mccCodesApi = {
  async getAll() {
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('mcc_codes')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      logError('Error fetching MCC codes:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('banks')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      logError('Error fetching banks:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('epk_institutions')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      logError('Error fetching EPK list:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('ok_institutions')
      .select('*')
      .order('kod', { ascending: true });

    if (error) {
      logError('Error fetching OK list:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('sales_representatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching sales reps:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('job_titles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching job titles:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('partnerships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching partnerships:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('account_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching account items:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('fixed_commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching fixed commissions:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('additional_revenues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching additional revenues:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('sharings') // ✅ FIXED: 'sharing' → 'sharings' (plural)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching sharing records:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('card_programs') // ✅ FIXED: 'kart_program' → 'card_programs' (English + plural)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching kart program records:', error);
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
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('suspension_reasons') // ✅ FIXED: 'suspension_reason' → 'suspension_reasons' (plural)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching suspension reason records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} suspension reason records from Supabase`);
    
    // ✅ CRITICAL FIX: Manual field mapping 'neden' (Supabase) → 'reason' (Frontend)
    const mappedData = data.map(item => {
      const camelCased = objectToCamelCase(item);
      
      // 🔥 SPECIAL HANDLING: 'neden' is Turkish word, won't convert automatically
      // We must MANUALLY map 'neden' → 'reason'
      const mapped: any = { ...camelCased };
      
      // Map 'neden' field to 'reason'
      if (item.neden !== undefined) {
        mapped.reason = item.neden;
        delete mapped.neden; // Remove Turkish field
      }
      
      // Fix date field
      if (camelCased.createdAt) {
        mapped.olusturmaTarihi = camelCased.createdAt;
      }
      
      return mapped;
    });
    
    return { success: true, data: mappedData || [] };
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
    
    // 🔧 UTF8 CLEANING HELPER FUNCTION
    const cleanUTF8 = (str: string): string => {
      if (!str || typeof str !== 'string') return str;
      // Remove control characters (0x00-0x1F) except newline, tab, carriage return
      // Also remove DEL (0x7F) and C1 control codes (0x80-0x9F)
      return str
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        // Replace replacement character
        .replace(/\uFFFD/g, '');
    };
    
    // ✅ Step 2: Apply transformations + UTF8 cleaning
    const transformedItems = uniqueRecords
      .map(objectToSnakeCase)
      .map(sanitizeSuspensionReason)
      .map(item => {
        // Clean all string fields to prevent UTF8 errors
        const cleaned: any = { ...item };
        Object.keys(cleaned).forEach(key => {
          if (typeof cleaned[key] === 'string') {
            cleaned[key] = cleanUTF8(cleaned[key]);
          }
        });
        return cleaned;
      });
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate suspension reasons AFTER sanitization`);
    }
    
    console.log(`📤 Final: Sending ${finalItems.length} unique suspension reason records to Supabase...`);
    
    // ✅ Safe JSON.stringify with try-catch
    try {
      console.log('📋 DEBUGGING - Final items to upsert:', JSON.stringify(finalItems, null, 2));
    } catch (e) {
      console.warn('⚠️ JSON.stringify failed for finalItems:', e);
      console.log('📋 DEBUGGING - Final items (raw):', finalItems);
    }
    
    const { data, error } = await supabase
      .from('suspension_reasons') // ✅ FIXED: 'suspension_reason' → 'suspension_reasons' (plural)
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error upserting suspension reason records:', error);
      
      // ✅ Safe JSON.stringify with try-catch for error logging
      try {
        console.error('📋 Error details:', JSON.stringify(error, null, 2));
      } catch (e) {
        console.error('📋 Error details (raw):', error);
      }
      
      try {
        console.error('📋 Attempted to upsert data:', JSON.stringify(finalItems, null, 2));
      } catch (e) {
        console.error('📋 Attempted to upsert data (raw):', finalItems);
      }
      
      return { success: false, error: error.message };
    }

    console.log(`✅ Upserted ${data.length} suspension reason records in Supabase`);
    
    // ✅ CRITICAL FIX: Manual field mapping 'neden' (Supabase) → 'reason' (Frontend)
    const mappedData = data.map(item => {
      const camelCased = objectToCamelCase(item);
      
      // 🔥 SPECIAL HANDLING: 'neden' is Turkish word, won't convert automatically
      const mapped: any = { ...camelCased };
      
      // Map 'neden' field to 'reason'
      if (item.neden !== undefined) {
        mapped.reason = item.neden;
        delete mapped.neden; // Remove Turkish field
      }
      
      // Fix date field
      if (camelCased.createdAt) {
        mapped.olusturmaTarihi = camelCased.createdAt;
      }
      
      return mapped;
    });
    
    return { success: true, data: mappedData, count: data.length };
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
// DOMAIN MAPPINGS API
// ========================================

export const domainMappingApi = {
  async getAll() {
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('domain_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching domain mapping records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} domain mapping records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating domain mapping records in Supabase...');
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate domain mappings (by id)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate domain mappings after sanitization`);
    }
    
    const { data, error } = await supabase
      .from('domain_mappings')
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error creating domain mappings:', error);
      return { success: false, error: error.message, count: 0 };
    }

    console.log(`✅ Created/updated ${data.length} domain mapping records in Supabase`);
    return { success: true, count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting domain mapping ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('domain_mappings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ Error deleting domain mapping ${id}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted domain mapping ${id} from Supabase`);
    return { success: true };
  },
};

// ========================================
// SIGNS (TABELA) API
// ========================================

export const signApi = {
  async getAll() {
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('signs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching sign records:', error);
      return { success: false, error: error.message, data: [] };
    }

    const camelCasedData = data.map(objectToCamelCase);
    console.log(`✅ Fetched ${data.length} sign records from Supabase`);
    return { success: true, data: camelCasedData || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating sign records in Supabase...');
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate signs (by id)`);
    }
    
    // ✅ Step 2: WHITELIST - Only allow valid Supabase columns
    const VALID_FIELDS = [
      'id', 'firmaId', 'urun', 'aktif', 'kartTipi', 'yurtIciDisi', 'kisaAciklama',
      'kartProgramIds', 'bankIds', 'gelirModeli', 'komisyonOranları', 'paylaşımOranları',
      'hazineGeliri', 'ekGelirDetay',  
      'aciklama', 'fotograf', 'olusturmaTarihi', 'guncellemeTarihi',
      'createdAt', 'updatedAt'
    ];
    
    const sanitizedRecords = uniqueRecords.map(record => {
      const clean: any = {};
      VALID_FIELDS.forEach(field => {
        if (field in record) {
          clean[field] = record[field];
        }
      });
      return clean;
    });
    
    // ✅ Step 3: Apply snake_case transformation + FIX Turkish characters
    const transformedItems = sanitizedRecords.map(record => {
      return objectToSnakeCase(record);
    });
    
    // ✅ Step 4: Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 4: Removed ${transformedItems.length - finalItems.length} duplicate signs after sanitization`);
    }
    
    const { data, error } = await supabase
      .from('signs')
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error creating signs:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error message:', error.message);
      console.error('❌ Error hint:', error.hint);
      console.error('❌ Error code:', error.code);
      console.error('❌ Sample record being sent:', JSON.stringify(finalItems[0], null, 2));
      return { success: false, error: error.message, count: 0 };
    }

    console.log(`✅ Created/updated ${data.length} sign records in Supabase`);
    return { success: true, count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting sign ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('signs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ Error deleting sign ${id}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted sign ${id} from Supabase`);
    return { success: true };
  },
};

// ========================================
// EARNINGS (HAKEDİŞ) API
// ========================================

export const earningsApi = {
  async getAll() {
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('earnings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching earnings records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} earnings records from Supabase`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  async create(records: any | any[]) {
    console.log('📤 Creating earnings records in Supabase...');
    
    const recordsArray = Array.isArray(records) ? records : [records];
    
    // ✅ Step 1: Remove duplicates by 'id' before processing
    const uniqueRecords = Array.from(
      new Map(recordsArray.map(r => [r.id, r])).values()
    );
    
    if (uniqueRecords.length < recordsArray.length) {
      console.warn(`⚠️ Step 1: Removed ${recordsArray.length - uniqueRecords.length} duplicate earnings (by id)`);
    }
    
    // ✅ Step 2: Apply transformations
    const transformedItems = uniqueRecords.map(objectToSnakeCase);
    
    // ✅ Step 3: CRITICAL FIX - Remove duplicates AFTER sanitization
    const finalItems = Array.from(
      new Map(transformedItems.map(item => [item.id, item])).values()
    );
    
    if (finalItems.length < transformedItems.length) {
      console.warn(`⚠️ Step 3: Removed ${transformedItems.length - finalItems.length} duplicate earnings after sanitization`);
    }
    
    const { data, error } = await supabase
      .from('earnings')
      .upsert(finalItems, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Error creating earnings:', error);
      return { success: false, error: error.message, count: 0 };
    }

    console.log(`✅ Created/updated ${data.length} earnings records in Supabase`);
    return { success: true, count: data.length };
  },

  async delete(id: string) {
    console.log(`🗑️ Deleting earnings ${id} from Supabase...`);
    
    const { error } = await supabase
      .from('earnings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ Error deleting earnings ${id}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Deleted earnings ${id} from Supabase`);
    return { success: true };
  },
};

// ========================================
// CUSTOMER DOCUMENTS API (Müşteri Evrakları)
// ========================================

export const documentApi = {
  /**
   * Get all documents for a specific customer
   */
  async getByCustomerId(customerId: string) {
    const check = checkSupabase();
    if (!check.available) return check.fallback;

    const { data, error } = await supabase!
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      logError('Error fetching customer documents:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} documents for customer ${customerId}`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  },

  /**
   * Upload a document to Supabase Storage and create database record
   */
  async upload(params: {
    customerId: string;
    documentType: 'vergi_levhasi' | 'ticaret_sicil_gazetesi' | 'faaliyet_belgesi' | 'imza_sirküleri' | 'other';
    file: File;
    isRequired?: boolean;
    uploadedBy?: string;
  }) {
    try {
      console.log('📤 Uploading document to Supabase Storage...');
      
      const { customerId, documentType, file, isRequired = false, uploadedBy } = params;
      
      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        return { 
          success: false, 
          error: 'Dosya boyutu 5MB\'ı aşamaz' 
        };
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return { 
          success: false, 
          error: 'Sadece PDF, JPG ve PNG dosyaları yüklenebilir' 
        };
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${customerId}/${documentType}_${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      console.log('✅ File uploaded to storage:', uploadData.path);

      // Create database record
      const documentRecord = {
        customer_id: customerId,
        document_type: documentType,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        is_required: isRequired,
        status: 'pending',
        uploaded_by: uploadedBy || null
      };

      const { data: dbData, error: dbError } = await supabase
        .from('customer_documents')
        .insert([documentRecord])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        // Clean up uploaded file if DB insert fails
        await supabase.storage
          .from('customer-documents')
          .remove([uploadData.path]);
        return { success: false, error: dbError.message };
      }

      console.log('✅ Document record created:', dbData.id);
      return { 
        success: true, 
        data: objectToCamelCase(dbData),
        message: 'Evrak başarıyla yüklendi'
      };

    } catch (error: any) {
      console.error('❌ Exception in documentApi.upload:', error);
      return { success: false, error: error.message || 'Bilinmeyen hata' };
    }
  },

  /**
   * Update document status (approve/reject)
   */
  async updateStatus(params: {
    documentId: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    notes?: string;
    reviewedBy?: string;
  }) {
    const { documentId, status, notes, reviewedBy } = params;
    
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    
    if (notes) updateData.notes = notes;
    if (reviewedBy) updateData.reviewed_by = reviewedBy;

    const { data, error } = await supabase
      .from('customer_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating document status:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Document ${documentId} status updated to ${status}`);
    return { success: true, data: objectToCamelCase(data) };
  },

  /**
   * Delete document (from both storage and database)
   */
  async delete(documentId: string) {
    try {
      console.log(`🗑️ Deleting document ${documentId}...`);
      
      // First, get the document to find the file path
      const { data: doc, error: fetchError } = await supabase
        .from('customer_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        logError('Error fetching document:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('customer-documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.warn('⚠️ Storage delete warning:', storageError);
        // Continue with DB deletion even if storage delete fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('customer_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('❌ Database delete error:', dbError);
        return { success: false, error: dbError.message };
      }

      console.log(`✅ Document ${documentId} deleted`);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Exception in documentApi.delete:', error);
      return { success: false, error: error.message || 'Bilinmeyen hata' };
    }
  },

  /**
   * Get public URL for a document (for viewing)
   */
  async getPublicUrl(filePath: string) {
    const { data } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Download document
   */
  async download(filePath: string) {
    const { data, error } = await supabase.storage
      .from('customer-documents')
      .download(filePath);

    if (error) {
      console.error('❌ Download error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  }
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

// ========================================
// EXPOSE APIs TO WINDOW FOR BROWSER CONSOLE
// ========================================

if (typeof window !== 'undefined') {
  (window as any).__OXIVO_SUPABASE__ = {
    ...(window as any).__OXIVO_SUPABASE__,
    apis: {
      customerApi,
      productApi,
      bankPFApi,
      mccCodesApi,
      banksApi,
      epkListApi,
      okListApi,
      salesRepsApi,
      jobTitlesApi,
      partnershipsApi,
      sharingApi,
      kartProgramApi,
      suspensionReasonApi,
      domainMappingApi,
      signApi,
      earningsApi,
      documentApi
    }
  };
  console.log('✅ All APIs available at window.__OXIVO_SUPABASE__.apis');
  
  // ✅ UUID VALIDATION TEST
  const testId = crypto.randomUUID();
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId);
  console.log(`🔍 UUID Generation Test: ${testId} ${isValidUUID ? '✅ VALID' : '❌ INVALID'}`);
}