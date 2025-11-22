/**
 * Supabase Client ve API Helpers
 * Direct Supabase Client mode - Frontend'den direkt Postgres erişimi
 */

import { createClient } from '@supabase/supabase-js';

// Correct project info
export const PROJECT_ID = "tveqpmzgqtoyagtpapev";
export const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZXFwbXpncXRveWFndHBhcGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDk1NzMsImV4cCI6MjA3ODcyNTU3M30.Lk5-tJOzPp3cvqQjGcK6utBx69CcAla2AKyBmqFPlm0";

// Supabase Client (singleton)
export const supabase = createClient(
  `https://${PROJECT_ID}.supabase.co`,
  ANON_KEY
);

// ========================================
// CUSTOMER API
// ========================================

export const customerApi = {
  /**
   * Tüm müşterileri getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('musteri_cari_kartlari')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customers:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} customers from Supabase`);
    return { success: true, data: data || [] };
  },

  /**
   * Tek müşteri getirir
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('musteri_cari_kartlari')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching customer:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  /**
   * Müşteri ekler (tek veya toplu)
   */
  async create(customers: any | any[]) {
    const records = Array.isArray(customers) ? customers : [customers];
    
    const { data, error } = await supabase
      .from('musteri_cari_kartlari')
      .insert(records)
      .select();

    if (error) {
      console.error('❌ Error creating customers:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Created ${data.length} customers in Supabase`);
    return { success: true, data, count: data.length };
  },

  /**
   * Müşteri günceller
   */
  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('musteri_cari_kartlari')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating customer:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Updated customer ${id} in Supabase`);
    return { success: true, data };
  },

  /**
   * Müşteri siler
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('musteri_cari_kartlari')
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
      .from('payterProducts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} products from Supabase`);
    return { success: true, data: data || [] };
  },

  /**
   * Ürün sync (upsert)
   */
  async sync(products: any[], strategy: 'merge' | 'replace' = 'merge') {
    if (strategy === 'replace') {
      // Önce tümünü sil
      await supabase.from('payterProducts').delete().neq('id', '');
    }

    // Upsert ile ekle/güncelle
    const { data, error } = await supabase
      .from('payterProducts')
      .upsert(products, { onConflict: 'serialNumber' })
      .select();

    if (error) {
      console.error('❌ Error syncing products:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Synced ${data.length} products to Supabase`);
    return {
      success: true,
      data,
      stats: {
        total: data.length,
        added: products.length,
        updated: 0,
      },
    };
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
      .from('bankPFRecords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching bankPF records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} bankPF records from Supabase`);
    return { success: true, data: data || [] };
  },

  /**
   * Bank/PF kayıtları ekler
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records : [records];
    
    const { data, error } = await supabase
      .from('bankPFRecords')
      .insert(items)
      .select();

    if (error) {
      console.error('❌ Error creating bankPF records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Created ${data.length} bankPF records in Supabase`);
    return { success: true, data, count: data.length };
  },
};

// ========================================
// INCOME API
// ========================================

export const incomeApi = {
  /**
   * Tüm gelir kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('income_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching income records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} income records from Supabase`);
    return { success: true, data: data || [] };
  },

  /**
   * Gelir kaydı ekler
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records : [records];
    
    const { data, error } = await supabase
      .from('income_records')
      .insert(items)
      .select();

    if (error) {
      console.error('❌ Error creating income records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Created ${data.length} income records in Supabase`);
    return { success: true, data, count: data.length };
  },
};

// ========================================
// SIGNS API
// ========================================

export const signsApi = {
  /**
   * Tüm tabela kayıtlarını getirir
   */
  async getAll() {
    const { data, error } = await supabase
      .from('signs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching sign records:', error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ Fetched ${data.length} sign records from Supabase`);
    return { success: true, data: data || [] };
  },

  /**
   * Tabela kaydı ekler
   */
  async create(records: any | any[]) {
    const items = Array.isArray(records) ? records : [records];
    
    const { data, error } = await supabase
      .from('signs')
      .insert(items)
      .select();

    if (error) {
      console.error('❌ Error creating sign records:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Created ${data.length} sign records in Supabase`);
    return { success: true, data, count: data.length };
  },
};

// ========================================
// DOMAINS API (KV Store için eski endpoint)
// ========================================

export const domainsApi = {
  /**
   * Domain listesini getirir (KV store)
   */
  async getAll() {
    const { data, error } = await supabase
      .from('kv_store_9ec5bbb3')
      .select('value')
      .eq('key', 'domains')
      .single();

    if (error) {
      console.error('❌ Error fetching domains:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data?.value || [] };
  },

  /**
   * Domain listesini günceller (KV store)
   */
  async sync(domains: any[]) {
    const { error } = await supabase
      .from('kv_store_9ec5bbb3')
      .upsert({ key: 'domains', value: domains });

    if (error) {
      console.error('❌ Error syncing domains:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Synced ${domains.length} domains to KV store`);
    return { success: true, data: domains, count: domains.length };
  },
};