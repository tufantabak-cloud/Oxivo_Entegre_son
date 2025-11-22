/**
 * Storage Migration Panel
 * localStorage ↔ Supabase geçiş ve senkronizasyon UI'ı
 * 
 * Created: 2025-11-17
 */

import { useState } from 'react';
import { Database, Cloud, HardDrive, RefreshCw, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  storage, 
  getStorageStrategy, 
  setStorageStrategy, 
  migrateToSupabase, 
  syncFromSupabase,
  type StorageStrategy 
} from '../utils/storage/index';
import { toast } from 'sonner';

export function StorageMigrationPanel() {
  const [currentStrategy, setCurrentStrategy] = useState<StorageStrategy | null>(getStorageStrategy());
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migrated: number;
    errors: string[];
  } | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    checked: boolean;
  }>({ isHealthy: false, checked: false });

  // Health check
  const checkHealth = async () => {
    try {
      const isHealthy = await storage.isHealthy();
      setHealthStatus({ isHealthy, checked: true });
      
      if (isHealthy) {
        toast.success('✅ Storage bağlantısı sağlıklı');
      } else {
        toast.error('❌ Storage bağlantısında sorun var');
      }
    } catch (error) {
      toast.error('Health check başarısız');
      setHealthStatus({ isHealthy: false, checked: true });
    }
  };

  // Strategy değiştir
  const handleStrategyChange = (strategy: StorageStrategy) => {
    setStorageStrategy(strategy);
    setCurrentStrategy(strategy);
    toast.success(`Storage stratejisi değiştirildi: ${strategy}`);
  };

  // Migration başlat
  const handleMigrate = async () => {
    if (!confirm('localStorage verilerini Supabase\'e aktarmak istediğinizden emin misiniz?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrateToSupabase();
      setMigrationResult(result);

      if (result.success) {
        toast.success(`✅ Migration başarılı! ${result.migrated} veri aktarıldı.`);
      } else {
        toast.error(`⚠️ Migration tamamlandı ama ${result.errors.length} hata var.`);
      }
    } catch (error: any) {
      toast.error(`Migration hatası: ${error.message}`);
      setMigrationResult({
        success: false,
        migrated: 0,
        errors: [error.message],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Sync from Supabase
  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const result = await syncFromSupabase();

      if (result.success) {
        toast.success(`✅ Senkronizasyon başarılı! ${result.synced} veri güncellendi.`);
      } else {
        toast.error(`⚠️ Senkronizasyon tamamlandı ama ${result.errors.length} hata var.`);
      }
    } catch (error: any) {
      toast.error(`Senkronizasyon hatası: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-4">
          <Database className="w-8 h-8 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Storage Migration & Sync</h2>
            <p className="text-gray-600 mt-1">
              localStorage ve Supabase arasında veri yönetimi ve geçiş işlemleri
            </p>
          </div>
        </div>
      </Card>

      {/* Current Strategy */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Mevcut Storage Stratejisi</h3>
          <Badge variant="outline" className="text-sm">
            {currentStrategy || 'Unknown'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={currentStrategy === 'localStorage-primary' ? 'default' : 'outline'}
            onClick={() => handleStrategyChange('localStorage-primary')}
            className="justify-start"
          >
            <HardDrive className="w-4 h-4 mr-2" />
            LocalStorage Primary
          </Button>
          <Button
            variant={currentStrategy === 'supabase-primary' ? 'default' : 'outline'}
            onClick={() => handleStrategyChange('supabase-primary')}
            className="justify-start"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Supabase Primary
          </Button>
          <Button
            variant={currentStrategy === 'localStorage-only' ? 'default' : 'outline'}
            onClick={() => handleStrategyChange('localStorage-only')}
            className="justify-start"
          >
            <HardDrive className="w-4 h-4 mr-2" />
            LocalStorage Only
          </Button>
          <Button
            variant={currentStrategy === 'supabase-only' ? 'default' : 'outline'}
            onClick={() => handleStrategyChange('supabase-only')}
            className="justify-start"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Supabase Only
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
          <strong>Primary stratejiler:</strong> İlk önce primary storage'dan okur, yoksa fallback'e gider. 
          Yazma işlemlerinde her ikisine de yazar.
        </div>
      </Card>

      {/* Health Check */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Storage Bağlantı Kontrolü</h3>
            <p className="text-sm text-gray-600 mt-1">
              LocalStorage ve Supabase bağlantısını test edin
            </p>
          </div>
          <Button onClick={checkHealth} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Kontrol Et
          </Button>
        </div>

        {healthStatus.checked && (
          <Alert className={`mt-4 ${healthStatus.isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {healthStatus.isHealthy ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className={healthStatus.isHealthy ? 'text-green-800' : 'text-red-800'}>
              {healthStatus.isHealthy 
                ? '✅ Storage bağlantıları sağlıklı çalışıyor' 
                : '❌ Storage bağlantısında sorun tespit edildi'}
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Migration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">LocalStorage → Supabase Migration</h3>
            <p className="text-sm text-gray-600 mt-1">
              Tüm localStorage verilerini Supabase'e aktarın
            </p>
          </div>
          <Button 
            onClick={handleMigrate} 
            disabled={isMigrating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Migration Yapılıyor...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Migration Başlat
              </>
            )}
          </Button>
        </div>

        {isMigrating && (
          <div className="mt-4">
            <Progress value={50} className="h-2" />
            <p className="text-sm text-gray-600 mt-2 text-center">
              Veriler Supabase'e aktarılıyor...
            </p>
          </div>
        )}

        {migrationResult && (
          <Alert className={`mt-4 ${migrationResult.success ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            {migrationResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            )}
            <AlertDescription>
              <div className={migrationResult.success ? 'text-green-800' : 'text-yellow-800'}>
                <strong>Migration Sonucu:</strong> {migrationResult.migrated} veri başarıyla aktarıldı.
                {migrationResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {migrationResult.errors.map((error, i) => (
                      <li key={i} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Sync */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Supabase → LocalStorage Sync</h3>
            <p className="text-sm text-gray-600 mt-1">
              Supabase'deki güncel verileri localStorage'a senkronize edin
            </p>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Senkronize Ediliyor...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Senkronize Et
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Info Box */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>💡 Önerilen Geçiş Süreci:</strong>
          <ol className="mt-2 space-y-1 ml-4 list-decimal">
            <li>Storage bağlantı kontrolü yapın</li>
            <li>Migration ile verileri Supabase'e aktarın</li>
            <li>Stratejisini "Supabase Primary" olarak değiştirin</li>
            <li>Uygulamayı test edin</li>
            <li>Her şey çalışıyorsa "Supabase Only" moduna geçin</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}