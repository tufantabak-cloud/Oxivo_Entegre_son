/**
 * 🗑️ OXIVO-BOX Soft Delete Helper Functions
 * 
 * Tüm API'lerde kullanılacak soft delete yardımcı fonksiyonları
 * 
 * ✅ KURAL: Hiçbir veri asla tamamen silinmez!
 * ✅ is_deleted: BOOLEAN - Kayıt silinmiş mi?
 * ✅ deleted_at: TIMESTAMP - Ne zaman silinmiş?
 * ✅ deleted_by: TEXT - Kim silmiş?
 * 
 * @version 1.0.0
 * @date 2024-12-17
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { objectToSnakeCase, objectToCamelCase } from './caseConverter';
import { addBackup } from './autoBackup';

export interface SoftDeleteResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Soft Delete - Kaydı veritabanından silmez, sadece işaretler
 */
export async function softDelete(
  supabase: SupabaseClient | null,
  tableName: string,
  id: string,
  deletedBy?: string
): Promise<SoftDeleteResult> {
  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabase client not available' 
    };
  }

  try {
    // Önce kaydı getir (yedekleme için)
    const { data: record, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`❌ [SOFT-DELETE] ${tableName}.${id} getirilemedi:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!record) {
      return { success: false, error: 'Kayıt bulunamadı' };
    }

    // ✅ AUTO-BACKUP: Silmeden önce yedekle
    addBackup(tableName, 'SOFT_DELETE', id, record);

    // Soft delete işlemi
    const updateData: any = {
      is_deleted: true,
      deleted_at: new Date().toISOString()
    };

    if (deletedBy) {
      updateData.deleted_by = deletedBy;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ [SOFT-DELETE] ${tableName}.${id} silinemedi:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [SOFT-DELETE] ${tableName}.${id} soft-deleted`);
    return { success: true, data: objectToCamelCase(data) };
  } catch (error: any) {
    console.error(`❌ [SOFT-DELETE] Beklenmeyen hata:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore - Soft delete edilen kaydı geri getirir
 */
export async function restoreDeleted(
  supabase: SupabaseClient | null,
  tableName: string,
  id: string,
  restoredBy?: string
): Promise<SoftDeleteResult> {
  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabase client not available' 
    };
  }

  try {
    // Önce kaydı getir (yedekleme için)
    const { data: record, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`❌ [RESTORE] ${tableName}.${id} getirilemedi:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!record) {
      return { success: false, error: 'Kayıt bulunamadı' };
    }

    // ✅ AUTO-BACKUP: Restore etmeden önce yedekle
    addBackup(tableName, 'RESTORE', id, record);

    // Restore işlemi
    const updateData: any = {
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      restored_at: new Date().toISOString()
    };

    if (restoredBy) {
      updateData.restored_by = restoredBy;
    }

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ [RESTORE] ${tableName}.${id} geri getirilemedi:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [RESTORE] ${tableName}.${id} restored`);
    return { success: true, data: objectToCamelCase(data) };
  } catch (error: any) {
    console.error(`❌ [RESTORE] Beklenmeyen hata:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Hard Delete - GERÇEKTEN siler (SADECE ADMIN İÇİN!)
 * ⚠️ DİKKAT: Bu fonksiyon sadece kritik durumlarda kullanılmalıdır!
 */
export async function hardDelete(
  supabase: SupabaseClient | null,
  tableName: string,
  id: string,
  confirmationToken: string
): Promise<SoftDeleteResult> {
  // ⚠️ GÜVENLİK: Token kontrolü
  if (confirmationToken !== 'CONFIRM_HARD_DELETE_PERMANENTLY') {
    return { 
      success: false, 
      error: 'Hard delete confirmation token required' 
    };
  }

  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabase client not available' 
    };
  }

  try {
    // Önce kaydı getir (yedekleme için)
    const { data: record, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`❌ [HARD-DELETE] ${tableName}.${id} getirilemedi:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!record) {
      return { success: false, error: 'Kayıt bulunamadı' };
    }

    // ✅ AUTO-BACKUP: Silmeden önce yedekle (GERİ ALINAMAZ!)
    addBackup(tableName, 'DELETE', id, record);

    // ⚠️ HARD DELETE - Kalıcı silme
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ [HARD-DELETE] ${tableName}.${id} silinemedi:`, error);
      return { success: false, error: error.message };
    }

    console.warn(`⚠️ [HARD-DELETE] ${tableName}.${id} PERMANENTLY DELETED!`);
    return { success: true, data: { id, deletedPermanently: true } };
  } catch (error: any) {
    console.error(`❌ [HARD-DELETE] Beklenmeyen hata:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Deleted Records - Soft delete edilmiş kayıtları getirir
 */
export async function getDeletedRecords(
  supabase: SupabaseClient | null,
  tableName: string
): Promise<SoftDeleteResult> {
  if (!supabase) {
    return { 
      success: false, 
      error: 'Supabase client not available',
      data: []
    };
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error(`❌ [GET-DELETED] ${tableName} silinen kayıtlar getirilemedi:`, error);
      return { success: false, error: error.message, data: [] };
    }

    console.log(`✅ [GET-DELETED] ${tableName}: ${data.length} silinen kayıt bulundu`);
    return { success: true, data: data.map(objectToCamelCase) || [] };
  } catch (error: any) {
    console.error(`❌ [GET-DELETED] Beklenmeyen hata:`, error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Check if table supports soft delete
 */
export async function checkSoftDeleteSupport(
  supabase: SupabaseClient | null,
  tableName: string
): Promise<{ supported: boolean; columns: string[] }> {
  if (!supabase) {
    return { supported: false, columns: [] };
  }

  try {
    // Tablodan bir kayıt getir ve kolonları kontrol et
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // Tablo boş olabilir, bu durumda metadata'dan kontrol edelim
      return { supported: false, columns: [] };
    }

    const columns = data ? Object.keys(data) : [];
    const hasIsDeleted = columns.includes('is_deleted');
    const hasDeletedAt = columns.includes('deleted_at');

    return {
      supported: hasIsDeleted || hasDeletedAt,
      columns
    };
  } catch (error: any) {
    console.error(`❌ Tablo yapısı kontrol edilemedi: ${tableName}`, error);
    return { supported: false, columns: [] };
  }
}