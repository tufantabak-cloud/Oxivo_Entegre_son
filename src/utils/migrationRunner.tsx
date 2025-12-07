import { useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    __OXIVO_SUPABASE__: {
      apis: {
        signApi: {
          getAll: () => Promise<{ data: any; error: any }>;
          create: (data: any) => Promise<{ data: any; error: any }>;
        };
        earningsApi: {
          getAll: () => Promise<{ data: any; error: any }>;
          create: (data: any) => Promise<{ data: any; error: any }>;
        };
      };
    };
  }
}

export function MigrationRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ success: 0, error: 0 });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(message);
  };

  const runMigration = async () => {
    if (!window.__OXIVO_SUPABASE__?.apis) {
      toast.error('Supabase API bulunamadı!');
      addLog('❌ HATA: window.__OXIVO_SUPABASE__.apis bulunamadı');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setStats({ success: 0, error: 0 });

    try {
      addLog('🚀 Migration başlatılıyor...');

      // LocalStorage'dan veri oku
      const signsData = JSON.parse(localStorage.getItem('signs') || '[]');
      const earningsData = JSON.parse(localStorage.getItem('earnings') || '[]');

      addLog(`📊 İstatistikler: ${signsData.length} TABELA, ${earningsData.length} HAKEDİŞ`);

      const { signApi, earningsApi } = window.__OXIVO_SUPABASE__.apis;
      let successCount = 0;
      let errorCount = 0;

      // TABELA Migration - Toplu kayıt (getById yerine getAll + create/update)
      if (signsData.length > 0) {
        addLog('📝 TABELA kayıtları işleniyor...');
        try {
          // Mevcut kayıtları al
          const existing = await signApi.getAll();
          const existingIds = new Set(existing.data?.map((r: any) => r.id) || []);
          
          // Yeni ve güncellenecekleri ayır
          const toCreate = signsData.filter((s: any) => !existingIds.has(s.id));
          const toUpdate = signsData.filter((s: any) => existingIds.has(s.id));
          
          // Toplu kayıt
          if (toCreate.length > 0) {
            const result = await signApi.create(toCreate);
            if (result.success) {
              addLog(`✅ ${toCreate.length} yeni TABELA kaydı eklendi`);
              successCount += toCreate.length;
            } else {
              addLog(`❌ TABELA ekleme hatası: ${result.error}`);
              errorCount += toCreate.length;
            }
          }
          
          if (toUpdate.length > 0) {
            const result = await signApi.create(toUpdate); // create = upsert
            if (result.success) {
              addLog(`✅ ${toUpdate.length} TABELA kaydı güncellendi`);
              successCount += toUpdate.length;
            } else {
              addLog(`❌ TABELA güncelleme hatası: ${result.error}`);
              errorCount += toUpdate.length;
            }
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
          const existing = await earningsApi.getAll();
          const existingIds = new Set(existing.data?.map((r: any) => r.id) || []);
          
          // Yeni ve güncellenecekleri ayır
          const toCreate = earningsData.filter((e: any) => !existingIds.has(e.id));
          const toUpdate = earningsData.filter((e: any) => existingIds.has(e.id));
          
          // Toplu kayıt
          if (toCreate.length > 0) {
            const result = await earningsApi.create(toCreate);
            if (result.success) {
              addLog(`✅ ${toCreate.length} yeni HAKEDİŞ kaydı eklendi`);
              successCount += toCreate.length;
            } else {
              addLog(`❌ HAKEDİŞ ekleme hatası: ${result.error}`);
              errorCount += toCreate.length;
            }
          }
          
          if (toUpdate.length > 0) {
            const result = await earningsApi.create(toUpdate); // create = upsert
            if (result.success) {
              addLog(`✅ ${toUpdate.length} HAKEDİŞ kaydı güncellendi`);
              successCount += toUpdate.length;
            } else {
              addLog(`❌ HAKEDİŞ güncelleme hatası: ${result.error}`);
              errorCount += toUpdate.length;
            }
          }
        } catch (error) {
          addLog(`❌ HAKEDİŞ migration hatası: ${error}`);
          errorCount += earningsData.length;
        }
      }

      setStats({ success: successCount, error: errorCount });
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

        <button
          onClick={runMigration}
          disabled={isRunning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRunning ? '⏳ Migration çalışıyor...' : '🚀 Migration Başlat'}
        </button>

        {stats.success > 0 || stats.error > 0 ? (
          <div className="mt-4 p-4 bg-gray-50 rounded border">
            <div className="flex gap-4">
              <span className="text-green-600">✅ Başarılı: {stats.success}</span>
              <span className="text-red-600">❌ Hatalı: {stats.error}</span>
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