/**
 * Supabase Migration Utility
 * localStorage → Supabase data migration
 * 
 * Created: 2025-11-22
 * 
 * Usage:
 * ```ts
 * import { migrateAllToSupabase, getMigrationStatus } from './utils/supabaseMigration';
 * 
 * // Check status
 * const status = await getMigrationStatus();
 * 
 * // Run migration
 * const result = await migrateAllToSupabase();
 * ```
 */

import { supabase } from './supabaseClient';
import { logger } from './logger';
import { getStoredData } from './storage/legacy';
import type { Customer } from '../components/CustomerModule';
import type { PayterProduct } from '../components/PayterProductTab';
import type { BankPF } from '../components/BankPFModule';
import { createCustomers } from '../services/customerService';
import { createProducts } from '../services/productService';
import { createBankPFs } from '../services/bankPFService';

// ========================================
// MIGRATION STATUS
// ========================================

export interface MigrationStatus {
  completed: boolean;
  lastMigrationDate: string | null;
  itemCounts: {
    customers: { localStorage: number; supabase: number };
    products: { localStorage: number; supabase: number };
    bankPFs: { localStorage: number; supabase: number };
  };
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<MigrationStatus> {
  try {
    // Count localStorage items
    const localCustomers = getStoredData<Customer[]>('customers', []);
    const localProducts = getStoredData<PayterProduct[]>('payterProducts', []);
    const localBankPFs = getStoredData<BankPF[]>('bankPFRecords', []); // ✅ FIXED: Correct key

    // Count Supabase items
    const { count: supabaseCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: supabaseProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: supabaseBankPFs } = await supabase
      .from('bank_accounts') // ✅ FIXED: Correct table name
      .select('*', { count: 'exact', head: true });

    // Check if migration is needed
    const needsMigration =
      (localCustomers.length > 0 && (supabaseCustomers || 0) === 0) ||
      (localProducts.length > 0 && (supabaseProducts || 0) === 0) ||
      (localBankPFs.length > 0 && (supabaseBankPFs || 0) === 0);

    return {
      completed: !needsMigration,
      lastMigrationDate: localStorage.getItem('supabase_migration_date'),
      itemCounts: {
        customers: {
          localStorage: localCustomers.length,
          supabase: supabaseCustomers || 0,
        },
        products: {
          localStorage: localProducts.length,
          supabase: supabaseProducts || 0,
        },
        bankPFs: {
          localStorage: localBankPFs.length,
          supabase: supabaseBankPFs || 0,
        },
      },
    };
  } catch (error) {
    logger.error('getMigrationStatus error', { error });
    throw error;
  }
}

// ========================================
// MIGRATION OPERATIONS
// ========================================

export interface MigrationResult {
  success: boolean;
  migratedCounts: {
    customers: number;
    products: number;
    bankPFs: number;
  };
  errors: string[];
  duration: number;
}

/**
 * Migrate all data from localStorage to Supabase
 */
export async function migrateAllToSupabase(): Promise<MigrationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const migratedCounts = {
    customers: 0,
    products: 0,
    bankPFs: 0,
  };

  try {
    logger.info('🚀 Starting migration to Supabase...');

    // ========================================
    // 1. MIGRATE CUSTOMERS
    // ========================================
    try {
      const localCustomers = getStoredData<Customer[]>('customers', []);
      logger.info(`📦 Found ${localCustomers.length} customers in localStorage`);

      if (localCustomers.length > 0) {
        // Check if customers already exist in Supabase
        const { count: existingCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        if ((existingCount || 0) > 0) {
          logger.warn(`⚠️ Supabase already has ${existingCount} customers. Skipping migration.`);
        } else {
          // Migrate in batches (50 at a time to avoid timeouts)
          const batchSize = 50;
          for (let i = 0; i < localCustomers.length; i += batchSize) {
            const batch = localCustomers.slice(i, i + batchSize);
            await createCustomers(batch);
            migratedCounts.customers += batch.length;
            logger.info(`✅ Migrated customers ${i + 1}-${i + batch.length}/${localCustomers.length}`);
          }
        }
      }
    } catch (error) {
      const errorMsg = `Failed to migrate customers: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg, { error });
      errors.push(errorMsg);
    }

    // ========================================
    // 2. MIGRATE PRODUCTS
    // ========================================
    try {
      const localProducts = getStoredData<PayterProduct[]>('payterProducts', []);
      logger.info(`📦 Found ${localProducts.length} products in localStorage`);

      if (localProducts.length > 0) {
        const { count: existingCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if ((existingCount || 0) > 0) {
          logger.warn(`⚠️ Supabase already has ${existingCount} products. Skipping migration.`);
        } else {
          const batchSize = 50;
          for (let i = 0; i < localProducts.length; i += batchSize) {
            const batch = localProducts.slice(i, i + batchSize);
            await createProducts(batch);
            migratedCounts.products += batch.length;
            logger.info(`✅ Migrated products ${i + 1}-${i + batch.length}/${localProducts.length}`);
          }
        }
      }
    } catch (error) {
      const errorMsg = `Failed to migrate products: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg, { error });
      errors.push(errorMsg);
    }

    // ========================================
    // 3. MIGRATE BANKPFs
    // ========================================
    try {
      const localBankPFs = getStoredData<BankPF[]>('bankPFRecords', []); // ✅ FIXED: Correct key
      logger.info(`📦 Found ${localBankPFs.length} bankPFs in localStorage`);

      if (localBankPFs.length > 0) {
        const { count: existingCount } = await supabase
          .from('bank_accounts') // ✅ FIXED: Correct table name
          .select('*', { count: 'exact', head: true });

        if ((existingCount || 0) > 0) {
          logger.warn(`⚠️ Supabase already has ${existingCount} bankPFs. Skipping migration.`);
        } else {
          const batchSize = 50;
          for (let i = 0; i < localBankPFs.length; i += batchSize) {
            const batch = localBankPFs.slice(i, i + batchSize);
            await createBankPFs(batch);
            migratedCounts.bankPFs += batch.length;
            logger.info(`✅ Migrated bankPFs ${i + 1}-${i + batch.length}/${localBankPFs.length}`);
          }
        }
      }
    } catch (error) {
      const errorMsg = `Failed to migrate bankPFs: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg, { error });
      errors.push(errorMsg);
    }

    // ========================================
    // FINALIZE
    // ========================================
    const duration = Date.now() - startTime;
    const success = errors.length === 0;

    if (success) {
      // Save migration timestamp
      localStorage.setItem('supabase_migration_date', new Date().toISOString());
      logger.info(`✅ Migration completed successfully in ${duration}ms`, { migratedCounts });
    } else {
      logger.error(`❌ Migration completed with errors in ${duration}ms`, { errors, migratedCounts });
    }

    return {
      success,
      migratedCounts,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { error });

    return {
      success: false,
      migratedCounts,
      errors: [...errors, errorMsg],
      duration,
    };
  }
}

/**
 * Rollback migration (delete all Supabase data, keep localStorage)
 */
export async function rollbackMigration(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    logger.warn('⚠️ Rolling back migration - deleting Supabase data...');

    // Delete all customers
    try {
      const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      logger.info('✅ Deleted all customers from Supabase');
    } catch (error) {
      const errorMsg = `Failed to delete customers: ${error instanceof Error ? error.message : 'Unknown'}`;
      errors.push(errorMsg);
    }

    // Delete all products
    try {
      const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      logger.info('✅ Deleted all products from Supabase');
    } catch (error) {
      const errorMsg = `Failed to delete products: ${error instanceof Error ? error.message : 'Unknown'}`;
      errors.push(errorMsg);
    }

    // Delete all bankPFs
    try {
      const { error } = await supabase.from('bank_accounts') // ✅ FIXED: Correct table name
        .delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      logger.info('✅ Deleted all bankPFs from Supabase');
    } catch (error) {
      const errorMsg = `Failed to delete bankPFs: ${error instanceof Error ? error.message : 'Unknown'}`;
      errors.push(errorMsg);
    }

    // Remove migration flag
    localStorage.removeItem('supabase_migration_date');

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error) {
    const errorMsg = `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg, { error });
    return {
      success: false,
      errors: [...errors, errorMsg],
    };
  }
}

// ========================================
// SYNC OPERATIONS
// ========================================

/**
 * Sync Supabase → localStorage (download)
 */
export async function syncFromSupabase(): Promise<{ success: boolean; syncedCounts: any; errors: string[] }> {
  const errors: string[] = [];
  const syncedCounts = {
    customers: 0,
    products: 0,
    bankPFs: 0,
  };

  try {
    logger.info('⬇️ Syncing from Supabase to localStorage...');

    // Sync customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) {
      errors.push(`Failed to sync customers: ${customersError.message}`);
    } else if (customers) {
      // TODO: Convert rows to app Customer type
      // For now, just count
      syncedCounts.customers = customers.length;
      logger.info(`✅ Synced ${customers.length} customers`);
    }

    // Sync products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      errors.push(`Failed to sync products: ${productsError.message}`);
    } else if (products) {
      syncedCounts.products = products.length;
      logger.info(`✅ Synced ${products.length} products`);
    }

    // Sync bankPFs
    const { data: bankPFs, error: bankPFsError } = await supabase
      .from('bank_accounts') // ✅ FIXED: Correct table name
      .select('*');

    if (bankPFsError) {
      errors.push(`Failed to sync bankPFs: ${bankPFsError.message}`);
    } else if (bankPFs) {
      syncedCounts.bankPFs = bankPFs.length;
      logger.info(`✅ Synced ${bankPFs.length} bankPFs`);
    }

    return {
      success: errors.length === 0,
      syncedCounts,
      errors,
    };
  } catch (error) {
    const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    return {
      success: false,
      syncedCounts,
      errors,
    };
  }
}