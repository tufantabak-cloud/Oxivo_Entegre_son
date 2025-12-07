import { useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    __OXIVO_SUPABASE__: {
      apis: {
        signApi: {
          getById: (id: string) => Promise<{ data: any; error: any }>;
          create: (data: any) => Promise<{ data: any; error: any }>;
          update: (id: string, data: any) => Promise<{ data: any; error: any }>;
        };
        earningsApi: {
          getById: (id: string) => Promise<{ data: any; error: any }>;
          create: (data: any) => Promise<{ data: any; error: any }>;
          update: (id: string, data: any) => Promise<{ data: any; error: any }>;
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

      // TABELA Migration
      addLog('📝 TABELA kayıtları işleniyor...');
      for (const sign of signsData) {
        try {
          const existing = await signApi.getById(sign.id);
          
          if (existing.data) {
            await signApi.update(sign.id, sign);
            addLog(`✅ TABELA güncellendi: ${sign.id}`);
          } else {
            await signApi.create(sign);
            addLog(`✅ TABELA eklendi: ${sign.id}`);
          }
          successCount++;
        } catch (error) {
          addLog(`❌ TABELA hatası: ${sign.id} - ${error}`);
          errorCount++;
        }
      }

      // HAKEDİŞ Migration
      addLog('💰 HAKEDİŞ kayıtları işleniyor...');
      for (const earning of earningsData) {
        try {
          const existing = await earningsApi.getById(earning.id);
          
          if (existing.data) {
            await earningsApi.update(earning.id, earning);
            addLog(`✅ HAKEDİŞ güncellendi: ${earning.id}`);
          } else {
            await earningsApi.create(earning);
            addLog(`✅ HAKEDİŞ eklendi: ${earning.id}`);
          }
          successCount++;
        } catch (error) {
          addLog(`❌ HAKEDİŞ hatası: ${earning.id} - ${error}`);
          errorCount++;
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