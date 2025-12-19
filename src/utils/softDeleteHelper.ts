/**
 * SOFT DELETE HELPER
 * ==================
 * Tüm silme işlemlerinde kullanılacak merkezi soft delete fonksiyonu
 * 
 * KRİTİK KURAL: Hiçbir koşulda veritabanından DELETE işlemi yapılmayacaktır
 * Bunun yerine:
 * 1. Kaydı yedekle (deleted_records_backup tablosuna)
 * 2. is_deleted = true yap (Soft Delete)
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface SoftDeleteOptions {
  tableName: string;
  recordId: string;
  deletedBy?: string;
  reason?: string;
}

interface SoftDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Soft delete işlemi yapar
 * @param supabase Supabase client instance
 * @param options Soft delete options
 * @returns Promise<SoftDeleteResult>
 */
export async function softDelete(
  supabase: SupabaseClient,
  options: SoftDeleteOptions
): Promise<SoftDeleteResult> {
  const { tableName, recordId, deletedBy = 'system', reason = 'Kullanıcı tarafından silindi' } = options;

  try {
    // 1. Kaydı getir (yedekleme için)
    const { data: record, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) {
      console.error(`❌ [SoftDelete] Record not found in ${tableName}:`, fetchError);
      return { success: false, error: 'Kayıt bulunamadı' };
    }

    // 2. Yedekle
    const { error: backupError } = await supabase
      .from('deleted_records_backup')
      .insert({
        table_name: tableName,
        record_id: recordId,
        record_data: record,
        deleted_by: deletedBy,
        reason: reason
      });

    if (backupError) {
      console.error(`❌ [SoftDelete] Backup error for ${tableName}:`, backupError);
      return { success: false, error: 'Yedekleme başarısız' };
    }

    // 3. Soft delete (is_deleted = true)
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ is_deleted: true })
      .eq('id', recordId);

    if (updateError) {
      console.error(`❌ [SoftDelete] Update error for ${tableName}:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ [SoftDelete] Successfully soft-deleted ${recordId} from ${tableName}`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ [SoftDelete] Exception for ${tableName}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Soft deleted kaydı geri yükler (restore)
 * @param supabase Supabase client instance
 * @param tableName Tablo adı
 * @param recordId Kayıt ID
 * @returns Promise<SoftDeleteResult>
 */
export async function restoreSoftDeleted(
  supabase: SupabaseClient,
  tableName: string,
  recordId: string
): Promise<SoftDeleteResult> {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ is_deleted: false })
      .eq('id', recordId);

    if (error) {
      console.error(`❌ [Restore] Error restoring ${recordId} from ${tableName}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [Restore] Successfully restored ${recordId} in ${tableName}`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ [Restore] Exception:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Soft deleted kayıtları listeler
 * @param supabase Supabase client instance
 * @param tableName Tablo adı (opsiyonel)
 * @returns Promise<any[]>
 */
export async function listSoftDeleted(
  supabase: SupabaseClient,
  tableName?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('deleted_records_backup')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [ListSoftDeleted] Error:', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('❌ [ListSoftDeleted] Exception:', err);
    return [];
  }
}
