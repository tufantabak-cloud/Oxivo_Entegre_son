import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { supabase } from './supabaseClient';
import { ENV_CONFIG, assertDevelopmentOnly } from './environmentConfig';

// ✅ SECURITY: Migration tool only available in development
if (!ENV_CONFIG.enableMigrationTools) {
  throw new Error('🚨 Migration tools are disabled in production');
}

interface MigrationStats {
  signsMigrated: number;
  earningsMigrated: number;
  errors: number;
}

export function MigrationRunner() {
  // ✅ RUNTIME CHECK: Prevent accidental usage in production
  React.useEffect(() => {
    assertDevelopmentOnly('Migration Runner');
  }, []);

  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<MigrationStats>({
    signsMigrated: 0,
    earningsMigrated: 0,
    errors: 0,
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(message);
  };

  const runMigration = async () => {
    if (!supabase) {
      toast.error('Supabase API bulunamadı!');
      addLog('❌ HATA: supabase bulunamadı');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setStats({ signsMigrated: 0, earningsMigrated: 0, errors: 0 });

    try {
      addLog('🚀 Migration başlatılıyor...');

      // LocalStorage'dan veri oku
      const signsData = JSON.parse(localStorage.getItem('signs') || '[]');
      const earningsData = JSON.parse(localStorage.getItem('earnings') || '[]');

      addLog(`📊 İstatistikler: ${signsData.length} TABELA, ${earningsData.length} HAKEDİŞ`);

      let successCount = 0;
      let errorCount = 0;

      // TABELA Migration - Toplu kayıt (getById yerine getAll + create/update)
      if (signsData.length > 0) {
        addLog('📝 TABELA kayıtları işleniyor...');
        try {
          // Mevcut kayıtları al
          const { data: existing, error } = await supabase
            .from('signs')
            .select('id');
          if (error) {
            throw new Error(error.message);
          }
          const existingIds = new Set(existing?.map((r: any) => r.id) || []);
          
          // Yeni ve güncellenecekleri ayır
          const toCreate = signsData.filter((s: any) => !existingIds.has(s.id));
          const toUpdate = signsData.filter((s: any) => existingIds.has(s.id));
          
          // Toplu kayıt
          if (toCreate.length > 0) {
            const { data, error } = await supabase
              .from('signs')
              .insert(toCreate);
            if (error) {
              throw new Error(error.message);
            }
            addLog(`✅ ${toCreate.length} yeni TABELA kaydı eklendi`);
            successCount += toCreate.length;
          }
          
          if (toUpdate.length > 0) {
            const { data, error } = await supabase
              .from('signs')
              .upsert(toUpdate);
            if (error) {
              throw new Error(error.message);
            }
            addLog(`✅ ${toUpdate.length} TABELA kaydı güncellendi`);
            successCount += toUpdate.length;
          }
        } catch (error) {
          addLog(`❌ TABELA migration hatası: ${error}`);
          errorCount += signsData.length;
        }
      }

      // HAKEDİŞ Migration - Toplu kayıt
      if (earningsData.length > 0) {
        addLog('💰 HAKEDİŞ kayıtları işleniyor...');
        try {
          // Mevcut kayıtları al
          const { data: existing, error } = await supabase
            .from('earnings')
            .select('id');
          if (error) {
            throw new Error(error.message);
          }
          const existingIds = new Set(existing?.map((r: any) => r.id) || []);
          
          // ✅ WHITELIST: Supabase'deki earnings tablosunda var olan alanlar
          const EARNINGS_VALID_FIELDS = [
            'id', 'firmaId', 'tabelaGroupId', 'tabelaGroupAd', 'donem',
            'olusturmaTarihi', 'guncellemeTarihi', 'vade', 'islemHacmiMap',
            'durum', 'notlar', 'olusturanKullanici', 'pfIslemHacmi', 'oxivoIslemHacmi',
            'manualEkGelirOxivoTotal', 'manualAnaTabelaOxivoTotal', 'manualAnaTabelaIslemHacmi',
            'totalIslemHacmi', 'totalPFPay', 'totalOxivoPay', 'aktif', 'createdAt', 'updatedAt'
          ];
          
          // Sadece geçerli alanları tut (ekGelirAciklama, ekGelirPFTL vs. gibi olmayan alanları çıkar)
          const sanitizedEarnings = earningsData.map((record: any) => {
            const clean: any = {};
            EARNINGS_VALID_FIELDS.forEach(field => {
              if (field in record) {
                clean[field] = record[field];
              }
            });
            return clean;
          });
          
          // Yeni ve güncellenecekleri ayır
          const toCreate = sanitizedEarnings.filter((e: any) => !existingIds.has(e.id));
          const toUpdate = sanitizedEarnings.filter((e: any) => existingIds.has(e.id));
          
          // Toplu kayıt
          if (toCreate.length > 0) {
            const { data, error } = await supabase
              .from('earnings')
              .insert(toCreate);
            if (error) {
              throw new Error(error.message);
            }
            addLog(`✅ ${toCreate.length} yeni HAKEDİŞ kaydı eklendi`);
            successCount += toCreate.length;
          }
          
          if (toUpdate.length > 0) {
            const { data, error } = await supabase
              .from('earnings')
              .upsert(toUpdate);
            if (error) {
              throw new Error(error.message);
            }
            addLog(`✅ ${toUpdate.length} HAKEDİŞ kaydı güncellendi`);
            successCount += toUpdate.length;
          }
        } catch (error) {
          addLog(`❌ HAKEDİŞ migration hatası: ${error}`);
          errorCount += earningsData.length;
        }
      }

      setStats({ signsMigrated: successCount, earningsMigrated: successCount, errors: errorCount });
      addLog(`🎉 Migration tamamlandı! Başarılı: ${successCount}, Hatalı: ${errorCount}`);
      
      if (errorCount === 0) {
        toast.success(`Migration başarılı! ${successCount} kayıt aktarıldı.`);
        addLog('🔄 3 saniye sonra sayfa yenilenecek...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.warning(`Migration tamamlandı. ${successCount} başarılı, ${errorCount} hatalı.`);
      }
    } catch (error) {
      addLog(`❌ GENEL HATA: ${error}`);
      toast.error('Migration sırasında hata oluştu!');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="mb-4">🔄 LocalStorage → Supabase Migration</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="mb-2">
            Bu araç, localStorage&apos;daki <strong>TABELA</strong> ve <strong>HAKEDİŞ</strong> verilerini 
            Supabase veritabanına aktarır.
          </p>
          <p className="text-sm text-gray-600">
            Mevcut kayıtlar güncellenir, yeni kayıtlar eklenir.
          </p>
        </div>

        <Button
          onClick={runMigration}
          disabled={isRunning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRunning ? '⏳ Migration çalışıyor...' : '🚀 Migration Başlat'}
        </Button>

        {stats.signsMigrated > 0 || stats.earningsMigrated > 0 || stats.errors > 0 ? (
          <div className="mt-4 p-4 bg-gray-50 rounded border">
            <div className="flex gap-4">
              <span className="text-green-600">✅ Başarılı: {stats.signsMigrated + stats.earningsMigrated}</span>
              <span className="text-red-600">❌ Hatalı: {stats.errors}</span>
            </div>
          </div>
        ) : null}

        {logs.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2">📋 İşlem Logları:</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}