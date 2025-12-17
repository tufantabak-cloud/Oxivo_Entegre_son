/**
 * Supabase Sync Helper
 * JSON import sonrası toplu veri senkronizasyonu
 */

import { customerApi, domainMappingApi, signApi } from './supabaseClient';
import { toast } from 'sonner';
import {
  mapCustomerToSupabase,
  mapBankAccountToSupabase,
  mapProductToSupabase,
  mapEarningToSupabase,
  mapSignToSupabase
} from '../types/supabaseFieldMapping';

interface SyncData {
  customers?: any[];
  bankPFRecords?: any[];
  payterProducts?: any[];
  banks?: any[];
  epkList?: any[];
  okList?: any[];
  domainMappings?: any[];
  signs?: any[];
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
        
        // Frontend formatından Supabase formatına dönüştür
        const mappedCustomers = data.customers.map(mapCustomerToSupabase);
        
        const result = await customerApi.create(mappedCustomers);
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
    
    // Domain Mappings sync - mapping gerekmez, şema uyumlu
    if (data.domainMappings && data.domainMappings.length > 0) {
      try {
        console.log(`  📤 Syncing ${data.domainMappings.length} domain mappings...`);
        const result = await domainMappingApi.create(data.domainMappings);
        if (result.success) {
          syncedCount++;
          console.log(`  ✅ Domain mappings synced: ${result.count} kayıt`);
        } else {
          syncErrors.push(`Domain Mappings: ${result.error}`);
          console.error(`  ❌ Domain mappings sync failed:`, result.error);
        }
      } catch (err) {
        syncErrors.push(`Domain Mappings: ${err}`);
        console.error(`  ❌ Domain mappings sync error:`, err);
      }
    }
    
    // Signs sync
    if (data.signs && data.signs.length > 0) {
      try {
        console.log(`  📤 Syncing ${data.signs.length} signs...`);
        
        // Frontend formatından Supabase formatına dönüştür
        const mappedSigns = data.signs.map(mapSignToSupabase);
        
        const result = await signApi.create(mappedSigns);
        if (result.success) {
          syncedCount++;
          console.log(`  ✅ Signs synced: ${result.count} kayıt`);
        } else {
          syncErrors.push(`Signs: ${result.error}`);
          console.error(`  ❌ Signs sync failed:`, result.error);
        }
      } catch (err) {
        syncErrors.push(`Signs: ${err}`);
        console.error(`  ❌ Signs sync error:`, err);
      }
    }
    
    // Sonuç bildirimi
    console.log(`☁️ Supabase sync tamamlandı: ${syncedCount} kategori`);
    
    if (syncedCount > 0) {
      toast.success(`☁️ ${syncedCount} kategori Supabase'e senkronize edildi`, {
        duration: 3000
      });
    }
    
    if (syncErrors.length > 0) {
      console.warn('⚠️ Bazı kategoriler sync edilemedi:', syncErrors);
      toast.warning('Bazı veriler Supabase\'e sync edilemedi - localStorage\'da mevcut', {
        duration: 5000
      });
    }
  } catch (error) {
    console.error('❌ Supabase sync genel hatası:', error);
    // Sessizce hata - veriler zaten localStorage'da
  }
}