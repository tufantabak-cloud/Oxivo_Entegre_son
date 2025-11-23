/**
 * Supabase Sync Helper
 * JSON import sonrası toplu veri senkronizasyonu
 */

import { customerApi } from './supabaseClient';
import { toast } from 'sonner';

interface SyncData {
  customers?: any[];
  bankPFRecords?: any[];
  payterProducts?: any[];
  banks?: any[];
  epkList?: any[];
  okList?: any[];
}

/**
 * JSON import sonrası tüm verileri Supabase'e senkronize eder
 * Background çalışır, kullanıcıyı bekletmez
 */
export async function syncToSupabase(data: SyncData): Promise<void> {
  console.log('☁️ Supabase sync başlatılıyor...');
  
  let syncedCount = 0;
  const syncErrors: string[] = [];
  
  try {
    // Customers sync
    if (data.customers && data.customers.length > 0) {
      try {
        console.log(`  📤 Syncing ${data.customers.length} customers...`);
        const result = await customerApi.create(data.customers);
        if (result.success) {
          syncedCount++;
          console.log(`  ✅ Customers synced: ${result.count} kayıt`);
        } else {
          syncErrors.push(`Müşteriler: ${result.error}`);
          console.error(`  ❌ Customers sync failed:`, result.error);
        }
      } catch (err) {
        syncErrors.push(`Müşteriler: ${err}`);
        console.error(`  ❌ Customers sync error:`, err);
      }
    }
    
    // Diğer tablolar için de benzer sync eklenebilir
    // BankPF, PayterProducts, vb.
    
    // Sonuç bildirimi
    console.log(`☁️ Supabase sync tamamlandı: ${syncedCount} kategori`);
    
    if (syncedCount > 0) {
      toast.success(`☁️ ${syncedCount} kategori Supabase'e senkronize edildi`, {
        duration: 3000
      });
    }
    
    if (syncErrors.length > 0) {
      console.warn('⚠️ Bazı kategoriler sync edilemedi:', syncErrors);
      toast.warning('Bazı veriler Supabase\\'e sync edilemedi - localStorage\\'da mevcut', {
        duration: 5000
      });
    }
  } catch (error) {
    console.error('❌ Supabase sync genel hatası:', error);
    // Sessizce hata - veriler zaten localStorage'da
  }
}
