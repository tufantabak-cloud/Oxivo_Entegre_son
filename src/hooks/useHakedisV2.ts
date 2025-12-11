/**
 * HAKEDİŞ V2 - CUSTOM HOOK
 * Supabase CRUD operations + state management
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { earningsApi } from '../utils/supabaseClient';
import { HakedisV2Record } from '../components/hakedis/types';

export function useHakedisV2(firmaId: string) {
  const [hakedisler, setHakedisler] = useState<HakedisV2Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📖 FETCH: Firma'ya ait hakediş listesi
  const fetchHakedisler = useCallback(async () => {
    if (!firmaId) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await earningsApi.getByFirmaId(firmaId);
      // Aktif olmayan kayıtları filtrele (soft delete)
      const activeRecords = result.filter((h: any) => h.aktif !== false);
      setHakedisler(activeRecords);
    } catch (err: any) {
      const errorMsg = err.message || 'Bilinmeyen hata';
      setError(errorMsg);
      console.error('❌ Hakediş yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [firmaId]);

  // ➕ CREATE: Yeni hakediş
  const createHakedis = useCallback(async (data: Partial<HakedisV2Record>) => {
    setLoading(true);

    try {
      const newRecord: HakedisV2Record = {
        id: crypto.randomUUID(),
        firmaId,
        tabelaGroupId: data.tabelaGroupId || '',
        tabelaGroupAd: data.tabelaGroupAd || '',
        donem: data.donem || new Date().toISOString().slice(0, 7),
        vade: data.vade || 'Tüm Vadeler',
        durum: 'Taslak',
        aktif: true,
        islemHacmiMap: data.islemHacmiMap || {},
        pfIslemHacmi: data.pfIslemHacmi || '',
        oxivoIslemHacmi: data.oxivoIslemHacmi || '',
        ekGelirAciklama: data.ekGelirAciklama || '',
        ekGelirPFTL: data.ekGelirPFTL || undefined,
        ekGelirOXTL: data.ekGelirOXTL || undefined,
        ekKesintiAciklama: data.ekKesintiAciklama || '',
        ekKesintiPFTL: data.ekKesintiPFTL || undefined,
        ekKesintiOXTL: data.ekKesintiOXTL || undefined,
        manualAnaTabelaIslemHacmi: data.manualAnaTabelaIslemHacmi || '',
        manualAnaTabelaOxivoTotal: data.manualAnaTabelaOxivoTotal || '',
        notlar: data.notlar || '',
        olusturanKullanici: data.olusturanKullanici,
        createdAt: new Date().toISOString(),
      };

      const result = await earningsApi.create(newRecord);

      if (result.success) {
        await fetchHakedisler(); // Liste yenile
        toast.success('✅ Hakediş oluşturuldu!');
        return { success: true, data: newRecord };
      } else {
        throw new Error(result.error || 'Kayıt başarısız');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Bilinmeyen hata';
      setError(errorMsg);
      toast.error(`❌ Oluşturma hatası: ${errorMsg}`);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [firmaId, fetchHakedisler]);

  // ✏️ UPDATE: Hakediş güncelle
  const updateHakedis = useCallback(async (id: string, data: Partial<HakedisV2Record>) => {
    setLoading(true);

    try {
      const updatedRecord = {
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      };

      const result = await earningsApi.update(id, updatedRecord);

      if (result.success) {
        await fetchHakedisler(); // Liste yenile
        toast.success('✅ Hakediş güncellendi!');
        return { success: true };
      } else {
        throw new Error(result.error || 'Güncelleme başarısız');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Bilinmeyen hata';
      setError(errorMsg);
      toast.error(`❌ Güncelleme hatası: ${errorMsg}`);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchHakedisler]);

  // 🗑️ DELETE: Soft delete (aktif = false)
  const deleteHakedis = useCallback(async (id: string) => {
    setLoading(true);

    try {
      // Soft delete: aktif = false olarak güncelle
      const result = await earningsApi.update(id, { aktif: false });

      if (result.success) {
        await fetchHakedisler(); // Liste yenile
        toast.success('✅ Hakediş silindi!');
        return { success: true };
      } else {
        throw new Error(result.error || 'Silme başarısız');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Bilinmeyen hata';
      setError(errorMsg);
      toast.error(`❌ Silme hatası: ${errorMsg}`);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [fetchHakedisler]);

  // 🔒 CONFIRM: Kesinleştir
  const confirmHakedis = useCallback(async (id: string) => {
    return updateHakedis(id, { durum: 'Kesinleşmiş' });
  }, [updateHakedis]);

  // 🔓 UNCONFIRM: Taslağa çevir
  const unconfirmHakedis = useCallback(async (id: string) => {
    return updateHakedis(id, { durum: 'Taslak' });
  }, [updateHakedis]);

  // 🔄 Initial load
  useEffect(() => {
    fetchHakedisler();
  }, [fetchHakedisler]);

  return {
    hakedisler,
    loading,
    error,
    createHakedis,
    updateHakedis,
    deleteHakedis,
    confirmHakedis,
    unconfirmHakedis,
    refresh: fetchHakedisler,
  };
}
