/**
 * Customer Service - Supabase CRUD Operations
 * 
 * Created: 2025-11-22
 */

import { supabase } from '../lib/supabase/client';
import { logger } from '../utils/logger';
import type { Customer } from '../components/CustomerModule';
import type { CustomersRow, CustomersInsert, CustomersUpdate } from '../types/database';
import { customerToRow, rowToCustomer } from '../types/mappers';

// ========================================
// READ OPERATIONS
// ========================================

/**
 * Get all customers
 */
export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    // Convert database rows to app types
    return (data || []).map(row => {
      const mapped = rowToCustomer(row);
      // Merge with additional fields not in database
      return {
        ...mapped,
        // Add fields that are not in database but required by app
        mcc: undefined,
        sektor: undefined,
        linkedBankPFIds: [],
      } as Customer;
    });
  } catch (error) {
    logger.error('customerService: getAllCustomers error', { error });
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }

    const mapped = rowToCustomer(data);
    return {
      ...mapped,
      mcc: undefined,
      sektor: undefined,
      linkedBankPFIds: [],
    } as Customer;
  } catch (error) {
    logger.error('customerService: getCustomerById error', { id, error });
    throw error;
  }
}

/**
 * Get customers by IDs (batch)
 */
export async function getCustomersByIds(ids: string[]): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .in('id', ids);

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToCustomer(row);
      return {
        ...mapped,
        mcc: undefined,
        sektor: undefined,
        linkedBankPFIds: [],
      } as Customer;
    });
  } catch (error) {
    logger.error('customerService: getCustomersByIds error', { ids, error });
    throw error;
  }
}

/**
 * Search customers by name
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToCustomer(row);
      return {
        ...mapped,
        mcc: undefined,
        sektor: undefined,
        linkedBankPFIds: [],
      } as Customer;
    });
  } catch (error) {
    logger.error('customerService: searchCustomers error', { query, error });
    throw error;
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new customer
 */
export async function createCustomer(customer: Customer): Promise<Customer> {
  try {
    const row = customerToRow(customer);
    
    const { data, error } = await supabase
      .from('customers')
      .insert([row as CustomersInsert])
      .select()
      .single();

    if (error) throw error;

    const mapped = rowToCustomer(data);
    return {
      ...customer,
      ...mapped,
      id: data.id,
    };
  } catch (error) {
    logger.error('customerService: createCustomer error', { customer, error });
    throw error;
  }
}

/**
 * Create multiple customers (batch)
 */
export async function createCustomers(customers: Customer[]): Promise<Customer[]> {
  try {
    const rows = customers.map(c => customerToRow(c) as CustomersInsert);
    
    const { data, error } = await supabase
      .from('customers')
      .insert(rows)
      .select();

    if (error) throw error;

    return (data || []).map((row, index) => {
      const mapped = rowToCustomer(row);
      return {
        ...customers[index],
        ...mapped,
        id: row.id,
      };
    });
  } catch (error) {
    logger.error('customerService: createCustomers error', { count: customers.length, error });
    throw error;
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update a customer
 */
export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  try {
    const row = customerToRow(updates as Customer);
    
    const { data, error } = await supabase
      .from('customers')
      .update(row as CustomersUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const mapped = rowToCustomer(data);
    return {
      ...updates,
      ...mapped,
      id: data.id,
    } as Customer;
  } catch (error) {
    logger.error('customerService: updateCustomer error', { id, updates, error });
    throw error;
  }
}

/**
 * Update multiple customers (batch)
 */
export async function updateCustomers(updates: Array<{ id: string; data: Partial<Customer> }>): Promise<Customer[]> {
  try {
    // Supabase doesn't support batch update directly, so we use Promise.all
    const promises = updates.map(({ id, data }) => updateCustomer(id, data));
    return await Promise.all(promises);
  } catch (error) {
    logger.error('customerService: updateCustomers error', { count: updates.length, error });
    throw error;
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    logger.info('customerService: deleted customer', { id });
  } catch (error) {
    logger.error('customerService: deleteCustomer error', { id, error });
    throw error;
  }
}

/**
 * Delete multiple customers (batch)
 */
export async function deleteCustomers(ids: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .in('id', ids);

    if (error) throw error;
    
    logger.info('customerService: deleted customers', { count: ids.length });
  } catch (error) {
    logger.error('customerService: deleteCustomers error', { ids, error });
    throw error;
  }
}

// ========================================
// UTILITY OPERATIONS
// ========================================

/**
 * Get customer count
 */
export async function getCustomerCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return count || 0;
  } catch (error) {
    logger.error('customerService: getCustomerCount error', { error });
    return 0;
  }
}

/**
 * Check if customer exists
 */
export async function customerExists(customerCode: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('customer_code', customerCode);

    if (error) throw error;

    return (count || 0) > 0;
  } catch (error) {
    logger.error('customerService: customerExists error', { customerCode, error });
    return false;
  }
}
