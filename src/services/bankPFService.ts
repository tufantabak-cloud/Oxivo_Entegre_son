/**
 * BankPF Service - Supabase CRUD Operations
 * 
 * Created: 2025-11-22
 * 
 * Bu service, bank_accounts tablosunu BankPF entity'si olarak kullanır
 */

import { supabase } from '../utils/supabaseClient';
import { logger } from '../utils/logger';
import type { BankPF } from '../components/BankPFModule';
import type { BankAccountsRow, BankAccountsInsert, BankAccountsUpdate } from '../types/database';
import { bankPFToRow, rowToBankPF } from '../types/mappers';

// ========================================
// READ OPERATIONS
// ========================================

/**
 * Get all BankPF records
 */
export async function getAllBankPFs(): Promise<BankPF[]> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('firma_unvan', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToBankPF(row);
      return {
        ...mapped,
      } as BankPF;
    });
  } catch (error) {
    logger.error('bankPFService: getAllBankPFs error', { error });
    throw error;
  }
}

/**
 * Get BankPF by ID
 */
export async function getBankPFById(id: string): Promise<BankPF | null> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    const mapped = rowToBankPF(data);
    return mapped as BankPF;
  } catch (error) {
    logger.error('bankPFService: getBankPFById error', { id, error });
    throw error;
  }
}

/**
 * Get BankPFs by IDs (batch)
 */
export async function getBankPFsByIds(ids: string[]): Promise<BankPF[]> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .in('id', ids);

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToBankPF(row);
      return mapped as BankPF;
    });
  } catch (error) {
    logger.error('bankPFService: getBankPFsByIds error', { ids, error });
    throw error;
  }
}

/**
 * Search BankPF by name
 */
export async function searchBankPFs(query: string): Promise<BankPF[]> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .or(`firma_unvan.ilike.%${query}%,banka_pf_ad.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToBankPF(row);
      return mapped as BankPF;
    });
  } catch (error) {
    logger.error('bankPFService: searchBankPFs error', { query, error });
    throw error;
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new BankPF
 */
export async function createBankPF(bankPF: BankPF): Promise<BankPF> {
  try {
    const row = bankPFToRow(bankPF);
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([row as BankAccountsInsert])
      .select()
      .single();

    if (error) throw error;

    const mapped = rowToBankPF(data);
    return {
      ...bankPF,
      ...mapped,
      id: data.id,
    };
  } catch (error) {
    logger.error('bankPFService: createBankPF error', { bankPF, error });
    throw error;
  }
}

/**
 * Create multiple BankPFs (batch)
 */
export async function createBankPFs(bankPFs: BankPF[]): Promise<BankPF[]> {
  try {
    const rows = bankPFs.map(bp => bankPFToRow(bp) as BankAccountsInsert);
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert(rows)
      .select();

    if (error) throw error;

    return (data || []).map((row, index) => {
      const mapped = rowToBankPF(row);
      return {
        ...bankPFs[index],
        ...mapped,
        id: row.id,
      };
    });
  } catch (error) {
    logger.error('bankPFService: createBankPFs error', { count: bankPFs.length, error });
    throw error;
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update a BankPF
 */
export async function updateBankPF(id: string, updates: Partial<BankPF>): Promise<BankPF> {
  try {
    const row = bankPFToRow(updates as BankPF);
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(row as BankAccountsUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const mapped = rowToBankPF(data);
    return {
      ...updates,
      ...mapped,
      id: data.id,
    } as BankPF;
  } catch (error) {
    logger.error('bankPFService: updateBankPF error', { id, updates, error });
    throw error;
  }
}

/**
 * Update multiple BankPFs (batch)
 */
export async function updateBankPFs(updates: Array<{ id: string; data: Partial<BankPF> }>): Promise<BankPF[]> {
  try {
    const promises = updates.map(({ id, data }) => updateBankPF(id, data));
    return await Promise.all(promises);
  } catch (error) {
    logger.error('bankPFService: updateBankPFs error', { count: updates.length, error });
    throw error;
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a BankPF
 */
export async function deleteBankPF(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    logger.info('bankPFService: deleted BankPF', { id });
  } catch (error) {
    logger.error('bankPFService: deleteBankPF error', { id, error });
    throw error;
  }
}

/**
 * Delete multiple BankPFs (batch)
 */
export async function deleteBankPFs(ids: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .in('id', ids);

    if (error) throw error;
    
    logger.info('bankPFService: deleted BankPFs', { count: ids.length });
  } catch (error) {
    logger.error('bankPFService: deleteBankPFs error', { ids, error });
    throw error;
  }
}

// ========================================
// UTILITY OPERATIONS
// ========================================

/**
 * Get BankPF count
 */
export async function getBankPFCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('bank_accounts')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return count || 0;
  } catch (error) {
    logger.error('bankPFService: getBankPFCount error', { error });
    return 0;
  }
}

/**
 * Check if BankPF exists
 */
export async function bankPFExists(accountCode: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('bank_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('account_code', accountCode);

    if (error) throw error;

    return (count || 0) > 0;
  } catch (error) {
    logger.error('bankPFService: bankPFExists error', { accountCode, error });
    return false;
  }
}