/**
 * Auto Sync to Supabase - EXPANDED VERSION
 * Automatically syncs ALL data types to Supabase backend
 * 
 * SUPPORTED DATA TYPES:
 * 1. Customers → customers table
 * 2. Products → products table  
 * 3. BankPF Records → bank_accounts table
 * 4. Definitions (13 types) → stored in localStorage only (not synced to Supabase)
 * 
 * USAGE IN APP.TSX:
 * ```
 * // Old: startAutoSync(customers);
 * // New:
 * syncAllData({
 *   customers,
 *   products: payterProducts,
 *   bankPF: bankPFRecords
 * });
 * ```
 */

import { customerApi, productApi, bankPFApi } from './supabaseClient';

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface SyncDataOptions {
  customers?: any[];
  products?: any[];
  bankPF?: any[];
}

export interface SyncResult {
  success: boolean;
  type: string;
  count?: number;
  error?: string;
}

// ========================================
// INDIVIDUAL SYNC FUNCTIONS
// ========================================

/**
 * Sync customers to Supabase
 */
export async function syncCustomers(customers: any[]): Promise<SyncResult> {
  if (!customers || customers.length === 0) {
    console.log('⏭️ Skipping customers sync: No data');
    return { success: true, type: 'customers', count: 0 };
  }

  console.log(`☁️ Syncing ${customers.length} customers to Supabase...`);

  try {
    const result = await customerApi.create(customers);
    
    if (result.success) {
      console.log(`✅ Customers synced: ${result.count} records`);
      return { success: true, type: 'customers', count: result.count };
    } else {
      console.error(`❌ Customers sync failed:`, result.error);
      return { success: false, type: 'customers', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Customers sync error:`, err);
    return { success: false, type: 'customers', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync products to Supabase
 */
export async function syncProducts(products: any[]): Promise<SyncResult> {
  if (!products || products.length === 0) {
    console.log('⏭️ Skipping products sync: No data');
    return { success: true, type: 'products', count: 0 };
  }

  console.log(`☁️ Syncing ${products.length} products to Supabase...`);

  try {
    const result = await productApi.create(products);
    
    if (result.success) {
      console.log(`✅ Products synced: ${result.count} records`);
      return { success: true, type: 'products', count: result.count };
    } else {
      console.error(`❌ Products sync failed:`, result.error);
      return { success: false, type: 'products', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Products sync error:`, err);
    return { success: false, type: 'products', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync BankPF records to Supabase
 */
export async function syncBankPF(bankPF: any[]): Promise<SyncResult> {
  if (!bankPF || bankPF.length === 0) {
    console.log('⏭️ Skipping BankPF sync: No data');
    return { success: true, type: 'bankPF', count: 0 };
  }

  console.log(`☁️ Syncing ${bankPF.length} BankPF records to Supabase...`);

  try {
    const result = await bankPFApi.create(bankPF);
    
    if (result.success) {
      console.log(`✅ BankPF records synced: ${result.count} records`);
      return { success: true, type: 'bankPF', count: result.count };
    } else {
      console.error(`❌ BankPF sync failed:`, result.error);
      return { success: false, type: 'bankPF', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ BankPF sync error:`, err);
    return { success: false, type: 'bankPF', error: err.message || 'Unknown error' };
  }
}

// ========================================
// BATCH SYNC FUNCTION
// ========================================

/**
 * Sync ALL data types to Supabase (batch operation)
 * 
 * @param options - Object containing all data arrays to sync
 * @returns Promise with array of sync results
 * 
 * @example
 * ```typescript
 * const results = await syncAllData({
 *   customers: customersArray,
 *   products: productsArray,
 *   bankPF: bankPFArray
 * });
 * 
 * console.log('Sync summary:', results);
 * ```
 */
export async function syncAllData(options: SyncDataOptions): Promise<SyncResult[]> {
  console.log('🚀 Starting batch sync to Supabase...');
  console.log('📊 Data summary:', {
    customers: options.customers?.length || 0,
    products: options.products?.length || 0,
    bankPF: options.bankPF?.length || 0
  });

  const results: SyncResult[] = [];

  // Sync customers
  if (options.customers) {
    results.push(await syncCustomers(options.customers));
  }

  // Sync products
  if (options.products) {
    results.push(await syncProducts(options.products));
  }

  // Sync BankPF records
  if (options.bankPF) {
    results.push(await syncBankPF(options.bankPF));
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log('✅ Batch sync complete!');
  console.log('📊 Summary:', {
    operations: results.length,
    successful: successCount,
    failed: failCount,
    totalRecords
  });

  if (failCount > 0) {
    console.warn('⚠️ Some operations failed:');
    results.filter(r => !r.success).forEach(r => {
      console.warn(`   - ${r.type}: ${r.error}`);
    });
  }

  return results;
}

// ========================================
// LEGACY SUPPORT (DEPRECATED)
// ========================================

/**
 * @deprecated Use syncAllData() instead
 * Legacy function for backwards compatibility
 */
export function startAutoSync(customers: any[]) {
  console.warn('⚠️ startAutoSync() is deprecated! Use syncAllData() instead');
  
  if (!customers || customers.length === 0) {
    console.log('⏭️ Auto-sync skipped: No customers to sync');
    return;
  }
  
  console.log(`☁️ Auto-syncing ${customers.length} customers to Supabase...`);
  
  customerApi.create(customers)
    .then(result => {
      if (result.success) {
        console.log(`✅ Auto-sync successful: ${result.count} customers synced to Supabase`);
        console.log('💡 Tip: Check Supabase Dashboard > Table Editor > customers to verify data');
      } else {
        console.error(`❌ Auto-sync failed:`, result.error);
        console.error('💡 Troubleshooting steps:');
        console.error('   1. Check if /SUPABASE_CUSTOMERS_FIX.sql was run in Supabase Dashboard');
        console.error('   2. Verify table exists: Go to Table Editor > public > customers');
        console.error('   3. Check RLS policies: Go to Authentication > Policies');
        console.error('   4. See /SUPABASE_CUSTOMERS_FIX_README.md for detailed guide');
      }
    })
    .catch(err => {
      console.error(`❌ Auto-sync error:`, err);
      console.error('💡 This is likely a network error or Supabase is unreachable');
    });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if data needs sync (compares localStorage with last sync timestamp)
 * @returns true if sync is needed, false otherwise
 */
export function needsSync(dataType: string): boolean {
  const lastSync = localStorage.getItem(`${dataType}_last_sync`);
  if (!lastSync) return true;

  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60);

  // Sync if more than 1 hour has passed
  return hoursSinceSync > 1;
}

/**
 * Update last sync timestamp
 */
export function updateSyncTimestamp(dataType: string): void {
  localStorage.setItem(`${dataType}_last_sync`, new Date().toISOString());
}

/**
 * Get sync status for all data types
 */
export function getSyncStatus(): Record<string, { lastSync: string | null; needsSync: boolean }> {
  return {
    customers: {
      lastSync: localStorage.getItem('customers_last_sync'),
      needsSync: needsSync('customers')
    },
    products: {
      lastSync: localStorage.getItem('products_last_sync'),
      needsSync: needsSync('products')
    },
    bankPF: {
      lastSync: localStorage.getItem('bankPF_last_sync'),
      needsSync: needsSync('bankPF')
    }
  };
}
