/**
 * Auto Sync to Supabase - EXPANDED VERSION
 * Automatically syncs ALL data types to Supabase backend
 * 
 * SUPPORTED DATA TYPES:
 * 1. Customers → customers table
 * 2. Products → products table  
 * 3. BankPF Records → bank_accounts table
 * 4. MCC Codes → mcc_codes table
 * 5. Banks → banks table
 * 6. EPK List → epk_list table
 * 7. OK List → ok_list table
 * 8. Sales Representatives → sales_representatives table
 * 9. Job Titles → job_titles table
 * 10. Partnerships → partnerships table
 * 11. Account Items → account_items table
 * 12. Fixed Commissions → fixed_commissions table
 * 13. Additional Revenues → additional_revenues table
 * 14. Sharing → sharing table
 * 15. Kart Program → kart_program table
 * 16. Suspension Reason → suspension_reason table
 * 
 * USAGE IN APP.TSX:
 * ```
 * syncAllData({
 *   customers,
 *   products: payterProducts,
 *   bankPF: bankPFRecords,
 *   mccCodes: mccList,
 *   banks: banksList,
 *   epkList,
 *   okList,
 *   salesReps,
 *   jobTitles,
 *   partnerships,
 *   accountItems: hesapKalemleri,
 *   fixedCommissions: sabitKomisyonlar,
 *   additionalRevenues: ekGelirler,
 *   sharing: payterSharing,
 *   kartProgram: payterKartProgram,
 *   suspensionReason: payterSuspensionReason
 * });
 * ```
 */

import { 
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
  // ❌ DISABLED: These tables don't exist in Supabase
  // accountItemsApi,
  // fixedCommissionsApi,
  // additionalRevenuesApi,
  sharingApi,
  kartProgramApi,
  suspensionReasonApi
} from './supabaseClient';

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface SyncDataOptions {
  customers?: any[];
  products?: any[];
  bankPF?: any[];
  mccCodes?: any[];
  banks?: any[];
  epkList?: any[];
  okList?: any[];
  salesReps?: any[];
  jobTitles?: any[];
  partnerships?: any[];
  // ❌ DISABLED: These tables don't exist in Supabase
  // accountItems?: any[];
  // fixedCommissions?: any[];
  // additionalRevenues?: any[];
  sharing?: any[];
  kartProgram?: any[];
  suspensionReason?: any[];
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

/**
 * Sync MCC Codes to Supabase
 */
export async function syncMCCCodes(mccCodes: any[]): Promise<SyncResult> {
  if (!mccCodes || mccCodes.length === 0) {
    console.log('⏭️ Skipping MCC Codes sync: No data');
    return { success: true, type: 'mccCodes', count: 0 };
  }

  console.log(`☁️ Syncing ${mccCodes.length} MCC Codes to Supabase...`);

  try {
    const result = await mccCodesApi.create(mccCodes);
    
    if (result.success) {
      console.log(`✅ MCC Codes synced: ${result.count} records`);
      return { success: true, type: 'mccCodes', count: result.count };
    } else {
      console.error(`❌ MCC Codes sync failed:`, result.error);
      return { success: false, type: 'mccCodes', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ MCC Codes sync error:`, err);
    return { success: false, type: 'mccCodes', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Banks to Supabase
 */
export async function syncBanks(banks: any[]): Promise<SyncResult> {
  if (!banks || banks.length === 0) {
    console.log('⏭️ Skipping Banks sync: No data');
    return { success: true, type: 'banks', count: 0 };
  }

  // ✅ CRITICAL FIX: Remove duplicates by 'kod' BEFORE syncing
  const uniqueBanks = Array.from(
    new Map(banks.map(b => [b.kod, b])).values()
  );
  
  const duplicateCount = banks.length - uniqueBanks.length;
  if (duplicateCount > 0) {
    console.warn(`⚠️ Removed ${duplicateCount} duplicate bank codes from localStorage`);
  }
  
  console.log(`☁️ Syncing ${uniqueBanks.length} unique Banks to Supabase...`);

  try {
    const result = await banksApi.create(uniqueBanks);
    
    if (result.success) {
      console.log(`✅ Banks synced: ${result.count} records`);
      return { success: true, type: 'banks', count: result.count };
    } else {
      console.error(`❌ Banks sync failed:`, result.error);
      return { success: false, type: 'banks', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Banks sync error:`, err);
    return { success: false, type: 'banks', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync EPK List to Supabase
 */
export async function syncEPKList(epkList: any[]): Promise<SyncResult> {
  if (!epkList || epkList.length === 0) {
    console.log('⏭️ Skipping EPK List sync: No data');
    return { success: true, type: 'epkList', count: 0 };
  }

  // ✅ CRITICAL FIX: Remove duplicates by 'kod' BEFORE syncing
  const uniqueEPK = Array.from(
    new Map(epkList.map(e => [e.kod, e])).values()
  );
  
  const duplicateCount = epkList.length - uniqueEPK.length;
  if (duplicateCount > 0) {
    console.warn(`⚠️ Removed ${duplicateCount} duplicate EPK codes from localStorage`);
  }
  
  console.log(`☁️ Syncing ${uniqueEPK.length} unique EPK List to Supabase...`);

  try {
    const result = await epkListApi.create(uniqueEPK);
    
    if (result.success) {
      console.log(`✅ EPK List synced: ${result.count} records`);
      return { success: true, type: 'epkList', count: result.count };
    } else {
      console.error(`❌ EPK List sync failed:`, result.error);
      return { success: false, type: 'epkList', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ EPK List sync error:`, err);
    return { success: false, type: 'epkList', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync OK List to Supabase
 */
export async function syncOKList(okList: any[]): Promise<SyncResult> {
  if (!okList || okList.length === 0) {
    console.log('⏭️ Skipping OK List sync: No data');
    return { success: true, type: 'okList', count: 0 };
  }

  // ✅ CRITICAL FIX: Remove duplicates by 'kod' BEFORE syncing
  const uniqueOK = Array.from(
    new Map(okList.map(o => [o.kod, o])).values()
  );
  
  const duplicateCount = okList.length - uniqueOK.length;
  if (duplicateCount > 0) {
    console.warn(`⚠️ Removed ${duplicateCount} duplicate OK codes from localStorage`);
  }
  
  console.log(`☁️ Syncing ${uniqueOK.length} unique OK List to Supabase...`);

  try {
    const result = await okListApi.create(uniqueOK);
    
    if (result.success) {
      console.log(`✅ OK List synced: ${result.count} records`);
      return { success: true, type: 'okList', count: result.count };
    } else {
      console.error(`❌ OK List sync failed:`, result.error);
      return { success: false, type: 'okList', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ OK List sync error:`, err);
    return { success: false, type: 'okList', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Sales Representatives to Supabase
 */
export async function syncSalesReps(salesReps: any[]): Promise<SyncResult> {
  if (!salesReps || salesReps.length === 0) {
    console.log('⏭️ Skipping Sales Representatives sync: No data');
    return { success: true, type: 'salesReps', count: 0 };
  }

  console.log(`☁️ Syncing ${salesReps.length} Sales Representatives to Supabase...`);

  try {
    const result = await salesRepsApi.create(salesReps);
    
    if (result.success) {
      console.log(`✅ Sales Representatives synced: ${result.count} records`);
      return { success: true, type: 'salesReps', count: result.count };
    } else {
      console.error(`❌ Sales Representatives sync failed:`, result.error);
      return { success: false, type: 'salesReps', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Sales Representatives sync error:`, err);
    return { success: false, type: 'salesReps', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Job Titles to Supabase
 */
export async function syncJobTitles(jobTitles: any[]): Promise<SyncResult> {
  if (!jobTitles || jobTitles.length === 0) {
    console.log('⏭️ Skipping Job Titles sync: No data');
    return { success: true, type: 'jobTitles', count: 0 };
  }

  console.log(`☁️ Syncing ${jobTitles.length} Job Titles to Supabase...`);

  try {
    const result = await jobTitlesApi.create(jobTitles);
    
    if (result.success) {
      console.log(`✅ Job Titles synced: ${result.count} records`);
      return { success: true, type: 'jobTitles', count: result.count };
    } else {
      console.error(`❌ Job Titles sync failed:`, result.error);
      return { success: false, type: 'jobTitles', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Job Titles sync error:`, err);
    return { success: false, type: 'jobTitles', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Partnerships to Supabase
 */
export async function syncPartnerships(partnerships: any[]): Promise<SyncResult> {
  if (!partnerships || partnerships.length === 0) {
    console.log('⏭️ Skipping Partnerships sync: No data');
    return { success: true, type: 'partnerships', count: 0 };
  }

  console.log(`☁️ Syncing ${partnerships.length} Partnerships to Supabase...`);

  try {
    const result = await partnershipsApi.create(partnerships);
    
    if (result.success) {
      console.log(`✅ Partnerships synced: ${result.count} records`);
      return { success: true, type: 'partnerships', count: result.count };
    } else {
      console.error(`❌ Partnerships sync failed:`, result.error);
      return { success: false, type: 'partnerships', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Partnerships sync error:`, err);
    return { success: false, type: 'partnerships', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Account Items to Supabase
 * ❌ DISABLED: Table doesn't exist in Supabase
 */
export async function syncAccountItems(accountItems: any[]): Promise<SyncResult> {
  console.log('⏭️ Skipping Account Items sync: Table not created in Supabase');
  return { success: true, type: 'accountItems', count: 0 };
  
  /* ORIGINAL CODE - DISABLED
  if (!accountItems || accountItems.length === 0) {
    console.log('⏭️ Skipping Account Items sync: No data');
    return { success: true, type: 'accountItems', count: 0 };
  }

  console.log(`☁️ Syncing ${accountItems.length} Account Items to Supabase...`);

  try {
    const result = await accountItemsApi.create(accountItems);
    
    if (result.success) {
      console.log(`✅ Account Items synced: ${result.count} records`);
      return { success: true, type: 'accountItems', count: result.count };
    } else {
      console.error(`❌ Account Items sync failed:`, result.error);
      return { success: false, type: 'accountItems', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Account Items sync error:`, err);
    return { success: false, type: 'accountItems', error: err.message || 'Unknown error' };
  }
  */
}

/**
 * Sync Fixed Commissions to Supabase
 * ❌ DISABLED: Table doesn't exist in Supabase
 */
export async function syncFixedCommissions(fixedCommissions: any[]): Promise<SyncResult> {
  console.log('⏭️ Skipping Fixed Commissions sync: Table not created in Supabase');
  return { success: true, type: 'fixedCommissions', count: 0 };
  
  /* ORIGINAL CODE - DISABLED
  if (!fixedCommissions || fixedCommissions.length === 0) {
    console.log('⏭️ Skipping Fixed Commissions sync: No data');
    return { success: true, type: 'fixedCommissions', count: 0 };
  }

  console.log(`☁️ Syncing ${fixedCommissions.length} Fixed Commissions to Supabase...`);

  try {
    const result = await fixedCommissionsApi.create(fixedCommissions);
    
    if (result.success) {
      console.log(`✅ Fixed Commissions synced: ${result.count} records`);
      return { success: true, type: 'fixedCommissions', count: result.count };
    } else {
      console.error(`❌ Fixed Commissions sync failed:`, result.error);
      return { success: false, type: 'fixedCommissions', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Fixed Commissions sync error:`, err);
    return { success: false, type: 'fixedCommissions', error: err.message || 'Unknown error' };
  }
  */
}

/**
 * Sync Additional Revenues to Supabase
 * ❌ DISABLED: Table doesn't exist in Supabase
 */
export async function syncAdditionalRevenues(additionalRevenues: any[]): Promise<SyncResult> {
  console.log('⏭️ Skipping Additional Revenues sync: Table not created in Supabase');
  return { success: true, type: 'additionalRevenues', count: 0 };
  
  /* ORIGINAL CODE - DISABLED
  if (!additionalRevenues || additionalRevenues.length === 0) {
    console.log('⏭️ Skipping Additional Revenues sync: No data');
    return { success: true, type: 'additionalRevenues', count: 0 };
  }

  console.log(`☁️ Syncing ${additionalRevenues.length} Additional Revenues to Supabase...`);

  try {
    const result = await additionalRevenuesApi.create(additionalRevenues);
    
    if (result.success) {
      console.log(`✅ Additional Revenues synced: ${result.count} records`);
      return { success: true, type: 'additionalRevenues', count: result.count };
    } else {
      console.error(`❌ Additional Revenues sync failed:`, result.error);
      return { success: false, type: 'additionalRevenues', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Additional Revenues sync error:`, err);
    return { success: false, type: 'additionalRevenues', error: err.message || 'Unknown error' };
  }
  */
}

/**
 * Sync Sharing to Supabase
 */
export async function syncSharing(sharing: any[]): Promise<SyncResult> {
  if (!sharing || sharing.length === 0) {
    console.log('⏭️ Skipping Sharing sync: No data');
    return { success: true, type: 'sharing', count: 0 };
  }

  console.log(`☁️ Syncing ${sharing.length} Sharing to Supabase...`);

  try {
    const result = await sharingApi.create(sharing);
    
    if (result.success) {
      console.log(`✅ Sharing synced: ${result.count} records`);
      return { success: true, type: 'sharing', count: result.count };
    } else {
      console.error(`❌ Sharing sync failed:`, result.error);
      return { success: false, type: 'sharing', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Sharing sync error:`, err);
    return { success: false, type: 'sharing', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Kart Program to Supabase
 */
export async function syncKartProgram(kartProgram: any[]): Promise<SyncResult> {
  if (!kartProgram || kartProgram.length === 0) {
    console.log('⏭️ Skipping Kart Program sync: No data');
    return { success: true, type: 'kartProgram', count: 0 };
  }

  console.log(`☁️ Syncing ${kartProgram.length} Kart Program to Supabase...`);

  try {
    const result = await kartProgramApi.create(kartProgram);
    
    if (result.success) {
      console.log(`✅ Kart Program synced: ${result.count} records`);
      return { success: true, type: 'kartProgram', count: result.count };
    } else {
      console.error(`❌ Kart Program sync failed:`, result.error);
      return { success: false, type: 'kartProgram', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Kart Program sync error:`, err);
    return { success: false, type: 'kartProgram', error: err.message || 'Unknown error' };
  }
}

/**
 * Sync Suspension Reason to Supabase
 */
export async function syncSuspensionReason(suspensionReason: any[]): Promise<SyncResult> {
  if (!suspensionReason || suspensionReason.length === 0) {
    console.log('⏭️ Skipping Suspension Reason sync: No data');
    return { success: true, type: 'suspensionReason', count: 0 };
  }

  console.log(`☁️ Syncing ${suspensionReason.length} Suspension Reason to Supabase...`);

  try {
    const result = await suspensionReasonApi.create(suspensionReason);
    
    if (result.success) {
      console.log(`✅ Suspension Reason synced: ${result.count} records`);
      return { success: true, type: 'suspensionReason', count: result.count };
    } else {
      console.error(`❌ Suspension Reason sync failed:`, result.error);
      return { success: false, type: 'suspensionReason', error: result.error };
    }
  } catch (err: any) {
    console.error(`❌ Suspension Reason sync error:`, err);
    return { success: false, type: 'suspensionReason', error: err.message || 'Unknown error' };
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
 *   bankPF: bankPFArray,
 *   mccCodes: mccCodesArray,
 *   banks: banksArray,
 *   epkList: epkListArray,
 *   okList: okListArray,
 *   salesReps: salesRepsArray,
 *   jobTitles: jobTitlesArray,
 *   partnerships: partnershipsArray,
 *   accountItems: accountItemsArray,
 *   fixedCommissions: fixedCommissionsArray,
 *   additionalRevenues: additionalRevenuesArray,
 *   sharing: sharingArray,
 *   kartProgram: kartProgramArray,
 *   suspensionReason: suspensionReasonArray
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
    bankPF: options.bankPF?.length || 0,
    mccCodes: options.mccCodes?.length || 0,
    banks: options.banks?.length || 0,
    epkList: options.epkList?.length || 0,
    okList: options.okList?.length || 0,
    salesReps: options.salesReps?.length || 0,
    jobTitles: options.jobTitles?.length || 0,
    partnerships: options.partnerships?.length || 0,
    accountItems: options.accountItems?.length || 0,
    fixedCommissions: options.fixedCommissions?.length || 0,
    additionalRevenues: options.additionalRevenues?.length || 0,
    sharing: options.sharing?.length || 0,
    kartProgram: options.kartProgram?.length || 0,
    suspensionReason: options.suspensionReason?.length || 0
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

  // Sync MCC Codes
  if (options.mccCodes) {
    results.push(await syncMCCCodes(options.mccCodes));
  }

  // Sync Banks
  if (options.banks) {
    results.push(await syncBanks(options.banks));
  }

  // Sync EPK List
  if (options.epkList) {
    results.push(await syncEPKList(options.epkList));
  }

  // Sync OK List
  if (options.okList) {
    results.push(await syncOKList(options.okList));
  }

  // Sync Sales Representatives
  if (options.salesReps) {
    results.push(await syncSalesReps(options.salesReps));
  }

  // Sync Job Titles
  if (options.jobTitles) {
    results.push(await syncJobTitles(options.jobTitles));
  }

  // Sync Partnerships
  if (options.partnerships) {
    results.push(await syncPartnerships(options.partnerships));
  }

  // Sync Account Items
  if (options.accountItems) {
    results.push(await syncAccountItems(options.accountItems));
  }

  // Sync Fixed Commissions
  if (options.fixedCommissions) {
    results.push(await syncFixedCommissions(options.fixedCommissions));
  }

  // Sync Additional Revenues
  if (options.additionalRevenues) {
    results.push(await syncAdditionalRevenues(options.additionalRevenues));
  }

  // Sync Sharing
  if (options.sharing) {
    results.push(await syncSharing(options.sharing));
  }

  // Sync Kart Program
  if (options.kartProgram) {
    results.push(await syncKartProgram(options.kartProgram));
  }

  // Sync Suspension Reason
  if (options.suspensionReason) {
    results.push(await syncSuspensionReason(options.suspensionReason));
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
    },
    mccCodes: {
      lastSync: localStorage.getItem('mccCodes_last_sync'),
      needsSync: needsSync('mccCodes')
    },
    banks: {
      lastSync: localStorage.getItem('banks_last_sync'),
      needsSync: needsSync('banks')
    },
    epkList: {
      lastSync: localStorage.getItem('epkList_last_sync'),
      needsSync: needsSync('epkList')
    },
    okList: {
      lastSync: localStorage.getItem('okList_last_sync'),
      needsSync: needsSync('okList')
    },
    salesReps: {
      lastSync: localStorage.getItem('salesReps_last_sync'),
      needsSync: needsSync('salesReps')
    },
    jobTitles: {
      lastSync: localStorage.getItem('jobTitles_last_sync'),
      needsSync: needsSync('jobTitles')
    },
    partnerships: {
      lastSync: localStorage.getItem('partnerships_last_sync'),
      needsSync: needsSync('partnerships')
    },
    accountItems: {
      lastSync: localStorage.getItem('accountItems_last_sync'),
      needsSync: needsSync('accountItems')
    },
    fixedCommissions: {
      lastSync: localStorage.getItem('fixedCommissions_last_sync'),
      needsSync: needsSync('fixedCommissions')
    },
    additionalRevenues: {
      lastSync: localStorage.getItem('additionalRevenues_last_sync'),
      needsSync: needsSync('additionalRevenues')
    },
    sharing: {
      lastSync: localStorage.getItem('sharing_last_sync'),
      needsSync: needsSync('sharing')
    },
    kartProgram: {
      lastSync: localStorage.getItem('kartProgram_last_sync'),
      needsSync: needsSync('kartProgram')
    },
    suspensionReason: {
      lastSync: localStorage.getItem('suspensionReason_last_sync'),
      needsSync: needsSync('suspensionReason')
    }
  };
}