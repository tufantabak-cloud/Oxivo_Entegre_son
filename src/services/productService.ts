/**
 * Product Service - Supabase CRUD Operations
 * 
 * Created: 2025-11-22
 */

import { supabase } from '../utils/supabaseClient';
import { logger } from '../utils/logger';
import type { PayterProduct } from '../components/PayterProductTab';
import type { ProductsRow, ProductsInsert, ProductsUpdate } from '../types/database';
import { productToRow, rowToProduct } from '../types/mappers';

// ========================================
// READ OPERATIONS
// ========================================

/**
 * Get all products
 */
export async function getAllProducts(): Promise<PayterProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToProduct(row);
      return {
        ...mapped,
      } as PayterProduct;
    });
  } catch (error) {
    logger.error('productService: getAllProducts error', { error });
    throw error;
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<PayterProduct | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    const mapped = rowToProduct(data);
    return mapped as PayterProduct;
  } catch (error) {
    logger.error('productService: getProductById error', { id, error });
    throw error;
  }
}

/**
 * Search products by name or serial number
 */
export async function searchProducts(query: string): Promise<PayterProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(row => {
      const mapped = rowToProduct(row);
      return mapped as PayterProduct;
    });
  } catch (error) {
    logger.error('productService: searchProducts error', { query, error });
    throw error;
  }
}

// ========================================
// CREATE OPERATIONS
// ========================================

/**
 * Create a new product
 */
export async function createProduct(product: PayterProduct): Promise<PayterProduct> {
  try {
    const row = productToRow(product);
    
    const { data, error } = await supabase
      .from('products')
      .insert([row as ProductsInsert])
      .select()
      .single();

    if (error) throw error;

    const mapped = rowToProduct(data);
    return {
      ...product,
      ...mapped,
      id: data.id,
    };
  } catch (error) {
    logger.error('productService: createProduct error', { product, error });
    throw error;
  }
}

/**
 * Create multiple products (batch)
 */
export async function createProducts(products: PayterProduct[]): Promise<PayterProduct[]> {
  try {
    const rows = products.map(p => productToRow(p) as ProductsInsert);
    
    const { data, error } = await supabase
      .from('products')
      .insert(rows)
      .select();

    if (error) throw error;

    return (data || []).map((row, index) => {
      const mapped = rowToProduct(row);
      return {
        ...products[index],
        ...mapped,
        id: row.id,
      };
    });
  } catch (error) {
    logger.error('productService: createProducts error', { count: products.length, error });
    throw error;
  }
}

// ========================================
// UPDATE OPERATIONS
// ========================================

/**
 * Update a product
 */
export async function updateProduct(id: string, updates: Partial<PayterProduct>): Promise<PayterProduct> {
  try {
    const row = productToRow(updates as PayterProduct);
    
    const { data, error } = await supabase
      .from('products')
      .update(row as ProductsUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const mapped = rowToProduct(data);
    return {
      ...updates,
      ...mapped,
      id: data.id,
    } as PayterProduct;
  } catch (error) {
    logger.error('productService: updateProduct error', { id, updates, error });
    throw error;
  }
}

// ========================================
// DELETE OPERATIONS
// ========================================

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    logger.info('productService: deleted product', { id });
  } catch (error) {
    logger.error('productService: deleteProduct error', { id, error });
    throw error;
  }
}

/**
 * Delete multiple products (batch)
 */
export async function deleteProducts(ids: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', ids);

    if (error) throw error;
    
    logger.info('productService: deleted products', { count: ids.length });
  } catch (error) {
    logger.error('productService: deleteProducts error', { ids, error });
    throw error;
  }
}

// ========================================
// UTILITY OPERATIONS
// ========================================

/**
 * Get product count
 */
export async function getProductCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return count || 0;
  } catch (error) {
    logger.error('productService: getProductCount error', { error });
    return 0;
  }
}