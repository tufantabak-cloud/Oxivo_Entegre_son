/**
Auto Sync to Supabase
Tüm veri tiplerini otomatik olarak Supabase'e senkronize eder

Supported Data Types:
- Customers (352 records)
- Bank/PF Accounts
- Petty Cash
- Categories
- Transactions
- Signs (Tabela)
- Income Records
- Products
 */

import {
  customerApi,
  productApi,
  bankPFApi,
  pettyCashApi,
  categoryApi,
  transactionApi,
  signApi,
  incomeApi,
} from './supabaseClient';

// ========================================
// TYPES
// ========================================

export interface SyncResult {
  success: boolean;
  count?: number;
  error?: string;
}

export interface SyncStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// ========================================
// INDIVIDUAL SYNC FUNCTIONS
// ========================================

/**
Müşterileri Supabase'e sync eder
 */
export async function syncCustomers(customers: any[]): Promise<SyncResult> {
  if (!customers || customers.length === 0) {
    console.log('⏭️ Skipping customers sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${customers.length} customers to Supabase...`);

  try {
    const result = await customerApi.create(customers);
    
    if (result.success) {
      console.log(`✅ Customers sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ Customers sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Customers sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
Ürünleri Supabase'e sync eder
 */
export async function syncProducts(products: any[]): Promise<SyncResult> {
  if (!products || products.length === 0) {
    console.log('⏭️ Skipping products sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${products.length} products to Supabase...`);

  try {
    const result = await productApi.sync(products, 'merge');
    
    if (result.success) {
      console.log(`✅ Products sync successful: ${result.data.length} records`);
      return { success: true, count: result.data.length };
    } else {
      console.error(`❌ Products sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Products sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
Bank/PF kayıtlarını Supabase'e sync eder
 */
export async function syncBankPF(records: any[]): Promise<SyncResult> {
  if (!records || records.length === 0) {
    console.log('⏭️ Skipping bankPF sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${records.length} bankPF records to Supabase...`);

  try {
    const result = await bankPFApi.create(records);
    
    if (result.success) {
      console.log(`✅ BankPF sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ BankPF sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ BankPF sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
Petty Cash kayıtlarını Supabase'e sync eder
 */
export async function syncPettyCash(records: any[]): Promise<SyncResult> {
  if (!records || records.length === 0) {
    console.log('⏭️ Skipping petty cash sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${records.length} petty cash records to Supabase...`);

  try {
    const result = await pettyCashApi.create(records);
    
    if (result.success) {
      console.log(`✅ Petty cash sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ Petty cash sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Petty cash sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
Kategorileri Supabase'e sync eder
 */
export async function syncCategories(records: any[]): Promise<SyncResult> {
  if (!records || records.length === 0) {
    console.log('⏭️ Skipping categories sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${records.length} categories to Supabase...`);

  try {
    const result = await categoryApi.create(records);
    
    if (result.success) {
      console.log(`✅ Categories sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ Categories sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Categories sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
İşlemleri Supabase'e sync eder
 */
export async function syncTransactions(records: any[]): Promise<SyncResult> {
  if (!records || records.length === 0) {
    console.log('⏭️ Skipping transactions sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${records.length} transactions to Supabase...`);

  try {
    const result = await transactionApi.create(records);
    
    if (result.success) {
      console.log(`✅ Transactions sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ Transactions sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Transactions sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
Tabelaları Supabase'e sync eder
 */
export async function syncSigns(records: any[]): Promise<SyncResult> {
  if (!records || records.length === 0) {
    console.log('⏭️ Skipping signs sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${records.length} signs to Supabase...`);

  try {
    const result = await signApi.create(records);
    
    if (result.success) {
      console.log(`✅ Signs sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ Signs sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Signs sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
Gelir kayıtlarını Supabase'e sync eder
 */
export async function syncIncome(records: any[]): Promise<SyncResult> {
  if (!records || records.length === 0) {
    console.log('⏭️ Skipping income sync - no data');
    return { success: true, count: 0 };
  }

  console.log(`☁️ Auto-syncing ${records.length} income records to Supabase...`);

  try {
    const result = await incomeApi.create(records);
    
    if (result.success) {
      console.log(`✅ Income sync successful: ${result.count} records`);
      return { success: true, count: result.count };
    } else {
      console.error(`❌ Income sync failed:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Income sync error:`, err);
    return { success: false, error: err.message || String(err) };
  }
}

// ========================================
// BATCH SYNC FUNCTION
// ========================================

/**
Tüm veri tiplerini tek seferde Supabase'e sync eder
 */
export async function syncAllData(data: {
  customers?: any[];
  products?: any[];
  bankPF?: any[];
  pettyCash?: any[];
  categories?: any[];
  transactions?: any[];
  signs?: any[];
  income?: any[];
}): Promise<SyncStats> {
  const stats: SyncStats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date(),
  };

  console.log('🚀 Starting full data sync to Supabase...');

  // Sync her veri tipi için
  const syncTasks = [
    { name: 'Customers', fn: () => syncCustomers(data.customers || []) },
    { name: 'Products', fn: () => syncProducts(data.products || []) },
    { name: 'BankPF', fn: () => syncBankPF(data.bankPF || []) },
    { name: 'PettyCash', fn: () => syncPettyCash(data.pettyCash || []) },
    { name: 'Categories', fn: () => syncCategories(data.categories || []) },
    { name: 'Transactions', fn: () => syncTransactions(data.transactions || []) },
    { name: 'Signs', fn: () => syncSigns(data.signs || []) },
    { name: 'Income', fn: () => syncIncome(data.income || []) },
  ];

  // Sırayla sync (paralel değil - rate limit için)
  for (const task of syncTasks) {
    try {
      const result = await task.fn();
      stats.total++;
      
      if (result.success) {
        if (result.count === 0) {
          stats.skipped++;
        } else {
          stats.successful++;
        }
      } else {
        stats.failed++;
        console.error(`❌ ${task.name} sync failed:`, result.error);
      }
    } catch (err) {
      stats.total++;
      stats.failed++;
      console.error(`❌ ${task.name} sync error:`, err);
    }
  }

  stats.endTime = new Date();
  stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

  console.log('✅ Full sync completed:', {
    total: stats.total,
    successful: stats.successful,
    failed: stats.failed,
    skipped: stats.skipped,
    duration: `${(stats.duration / 1000).toFixed(2)}s`,
  });

  return stats;
}

// ========================================
// LEGACY EXPORT (backwards compatibility)
// ========================================

/**
@deprecated Use syncCustomers() instead
 */
export function startAutoSync(customers: any[]) {
  syncCustomers(customers);
}
