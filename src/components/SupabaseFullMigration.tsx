/**
 * Supabase Full Migration Tool
 * 
 * İKİ YÖNLÜ VERİ AKTARIMI:
 * 1. localStorage → Supabase (Upload)
 * 2. Supabase → localStorage (Download)
 * 
 * KULLANIM:
 * 1. Bu component'i App.tsx'e ekleyin (geçici olarak)
 * 2. "Supabase'e Aktar" veya "localStorage'a Aktar" butonuna basın
 * 3. Tüm veriler otomatik olarak aktarılacak
 * 4. İşlem tamamlandıktan sonra bu component'i kaldırabilirsiniz
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  customerApi, 
  productApi, 
  bankPFApi,
  mccCodesApi,
  banksApi,
  epkListApi,
  okListApi,
  salesRepsApi,
  jobTitlesApi,
  partnershipsApi,
  sharingApi,
  kartProgramApi,
  suspensionReasonApi,
  domainMappingApi,
  signApi,
  earningsApi,
  SUPABASE_ENABLED
} from '../utils/supabaseClient';
import { Database, Upload, Download, CheckCircle, XCircle, AlertCircle, Loader2, Eye, Trash2, ArrowDownToLine } from 'lucide-react';

interface MigrationStep {
  name: string;
  key: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  count?: number;
  error?: string;
  api: any;
}

export function SupabaseFullMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationStats, setMigrationStats] = useState({ success: 0, error: 0, skipped: 0, total: 0 });
  const [steps, setSteps] = useState<MigrationStep[]>([
    { name: 'Müşteriler (Customers)', key: 'customers', status: 'pending', api: customerApi },
    { name: 'Ürünler (Products)', key: 'payterProducts', status: 'pending', api: productApi },
    { name: 'Banka/PF Kayıtları', key: 'bankPFRecords', status: 'pending', api: bankPFApi },
    { name: 'MCC Kodları', key: 'mccList', status: 'pending', api: mccCodesApi },
    { name: 'Bankalar', key: 'banks', status: 'pending', api: banksApi },
    { name: 'EPK Listesi', key: 'epkList', status: 'pending', api: epkListApi },
    { name: 'ÖK Listesi', key: 'okList', status: 'pending', api: okListApi },
    { name: 'Satış Temsilcileri', key: 'salesReps', status: 'pending', api: salesRepsApi },
    { name: 'Görev Ünvanları', key: 'jobTitles', status: 'pending', api: jobTitlesApi },
    { name: 'İşbirlikleri', key: 'partnerships', status: 'pending', api: partnershipsApi },
    { name: 'Gelir Paylaşımları', key: 'sharings', status: 'pending', api: sharingApi },
    { name: 'Kart Programları', key: 'kartProgramlar', status: 'pending', api: kartProgramApi },
    { name: 'Pasifleştirme Sebepleri', key: 'suspensionReasons', status: 'pending', api: suspensionReasonApi },
    { name: 'Domain Mappings', key: 'domainMappings', status: 'pending', api: domainMappingApi },
    { name: 'TABELA Kayıtları (Signs)', key: 'signs', status: 'pending', api: signApi },
    { name: 'Gelir Kayıtları (Earnings)', key: 'earnings', status: 'pending', api: earningsApi }
  ]);

  const updateStepStatus = (index: number, updates: Partial<MigrationStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const getLocalStorageData = (key: string): any[] => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`❌ localStorage okuma hatası [${key}]:`, error);
      return []
    }
  };

  // Preview: localStorage'daki kayıt sayılarını hesapla
  const previewCounts = () => {
    const counts = steps.map(step => ({
      ...step,
      count: getLocalStorageData(step.key).length
    }));
    setSteps(counts);
    toast.info('Önizleme yüklendi', {
      description: `Toplam ${counts.reduce((sum, s) => sum + (s.count || 0), 0)} kayıt bulundu`
    });
  };

  // 🆕 REVERSE MIGRATION: Supabase → localStorage
  const importFromSupabase = async () => {
    if (!SUPABASE_ENABLED) {
      toast.error('Supabase bağlantısı aktif değil!', {
        description: 'Figma Make ortamında Supabase kullanılamaz.'
      });
      return;
    }

    // Kullanıcıya onay sor
    const confirmed = window.confirm(
      '⚠️ DİKKAT: Bu işlem Supabase\'deki TÜM verileri localStorage\'a aktaracak.\n\n' +
      'Mevcut localStorage verileri SİLİNECEK ve Supabase\'deki verilerle DEĞİŞTİRİLECEK.\n\n' +
      'Devam etmek istiyor musunuz?'
    );

    if (!confirmed) {
      toast.info('İşlem iptal edildi');
      return;
    }

    setIsRunning(true);
    setMigrationComplete(false);
    setMigrationStats({ success: 0, error: 0, skipped: 0, total: 0 });
    
    // Tüm step'leri pending durumuna sıfırla
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, count: undefined, error: undefined })));
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStep(i);
      
      updateStepStatus(i, { status: 'running' });

      try {
        console.log(`📥 Downloading ${step.name} from Supabase...`);

        // Supabase'den veriyi çek
        const result = await step.api.getAll();

        if (!result.success) {
          throw new Error(result.error || 'Bilinmeyen hata');
        }

        const supabaseData = result.data || [];
        
        if (supabaseData.length === 0) {
          updateStepStatus(i, { 
            status: 'skipped', 
            count: 0,
            error: 'Supabase\'de veri bulunamadı' 
          });
          skippedCount++;
          console.log(`⏭️ Skipped ${step.name}: No data in Supabase`);
          continue;
        }

        // localStorage'a kaydet
        localStorage.setItem(step.key, JSON.stringify(supabaseData));
        
        updateStepStatus(i, { 
          status: 'success', 
          count: supabaseData.length 
        });
        successCount++;
        
        toast.success(`✅ ${step.name} indirildi`, {
          description: `${supabaseData.length} kayıt localStorage'a aktarıldı`
        });

        console.log(`✅ Downloaded ${step.name}: ${supabaseData.length} kayıt`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`❌ Download error [${step.name}]:`, error);
        updateStepStatus(i, { 
          status: 'error', 
          error: error.message || 'Bilinmeyen hata'
        });
        errorCount++;
        toast.error(`❌ ${step.name} indirilemedi`, {
          description: error.message || 'Bilinmeyen hata'
        });
      }
    }

    setIsRunning(false);
    setCurrentStep(steps.length);

    // Özet bildirimi
    toast.success('İndirme tamamlandı!', {
      description: `✅ Başarılı: ${successCount} | ⏭️ Atlandı: ${skippedCount} | ❌ Hata: ${errorCount}`
    });

    setMigrationComplete(true);
    setMigrationStats({ success: successCount, error: errorCount, skipped: skippedCount, total: steps.length });

    // Sayfayı yenilemeyi öner
    const reload = window.confirm(
      '✅ Veriler başarıyla localStorage\'a aktarıldı!\n\n' +
      'Değişikliklerin tüm modüllerde görünmesi için sayfayı yenilemek ister misiniz?'
    );

    if (reload) {
      window.location.reload();
    }
  };

  const migrateData = async () => {
    if (!SUPABASE_ENABLED) {
      toast.error('Supabase bağlantısı aktif değil!', {
        description: 'Figma Make ortamında Supabase kullanılamaz.'
      });
      return;
    }

    setIsRunning(true);
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStep(i);
      
      updateStepStatus(i, { status: 'running' });

      try {
        // localStorage'dan veriyi oku
        const localData = getLocalStorageData(step.key);
        
        if (localData.length === 0) {
          updateStepStatus(i, { 
            status: 'skipped', 
            count: 0,
            error: 'Veri bulunamadı' 
          });
          skippedCount++;
          continue;
        }

        console.log(`📤 Migrating ${step.name}: ${localData.length} kayıt`);

        // ✅ CREATE: Tüm veriyi tek seferde gönder (create metodu zaten toplu işlem destekliyor)
        const result = await step.api.create(localData);

        if (result.success) {
          updateStepStatus(i, { 
            status: 'success', 
            count: result.count || localData.length 
          });
          successCount++;
          toast.success(`✅ ${step.name} aktarıldı`, {
            description: `${result.count || localData.length} kayıt başarıyla eklendi`
          });
        } else {
          throw new Error(result.error || 'Bilinmeyen hata');
        }

        // Rate limiting için kısa bekleme (optional)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`❌ Migration error [${step.name}]:`, error);
        updateStepStatus(i, { 
          status: 'error', 
          error: error.message || 'Bilinmeyen hata'
        });
        errorCount++;
        toast.error(`❌ ${step.name} aktarılamadı`, {
          description: error.message || 'Bilinmeyen hata'
        });
      }
    }

    setIsRunning(false);
    setCurrentStep(steps.length);

    // Özet bildirimi
    toast.success('Migration tamamlandı!', {
      description: `✅ Başarılı: ${successCount} | ⏭️ Atlandı: ${skippedCount} | ❌ Hata: ${errorCount}`
    });

    setMigrationComplete(true);
    setMigrationStats({ success: successCount, error: errorCount, skipped: skippedCount, total: steps.length });
  };

  const progress = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;

  const getStatusIcon = (status: MigrationStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusBadge = (status: MigrationStep['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Tamamlandı</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Hata</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Çalışıyor...</Badge>;
      case 'skipped':
        return <Badge className="bg-gray-100 text-gray-600">Atlandı</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">Bekliyor</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <CardTitle>İki Yönlü Veri Aktarımı</CardTitle>
            <CardDescription>
              Supabase ⇄ localStorage arasında tam veri senkronizasyonu
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!SUPABASE_ENABLED && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Uyarı:</strong> Supabase bağlantısı aktif değil. Lütfen environment variables kontrol edin.
            </AlertDescription>
          </Alert>
        )}

        {SUPABASE_ENABLED && (
          <Alert className="border-blue-500 bg-blue-50">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>İki Yönlü Sync:</strong>
              <br />• <strong>Supabase'e Aktar (Upload):</strong> localStorage → Supabase (yeni kayıtlar eklenir)
              <br />• <strong>localStorage'a Aktar (Download):</strong> Supabase → localStorage (mevcut veriler değiştirilir)
            </AlertDescription>
          </Alert>
        )}

        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>İlerleme</span>
              <span>{currentStep} / {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`p-3 rounded-lg border transition-colors ${
                step.status === 'running' ? 'bg-blue-50 border-blue-300' :
                step.status === 'success' ? 'bg-green-50 border-green-300' :
                step.status === 'error' ? 'bg-red-50 border-red-300' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      {step.count !== undefined && (
                        <span className="text-sm text-gray-500">
                          ({step.count} kayıt)
                        </span>
                      )}
                    </div>
                    {step.error && (
                      <p className="text-sm text-red-600 mt-1">{step.error}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(step.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={previewCounts}
            disabled={isRunning}
            variant="outline"
            size="lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Önizleme
          </Button>
          
          <Button
            onClick={migrateData}
            disabled={isRunning || !SUPABASE_ENABLED}
            className="flex-1"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Aktarılıyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Supabase'e Aktar
              </>
            )}
          </Button>

          <Button
            onClick={importFromSupabase}
            disabled={isRunning || !SUPABASE_ENABLED}
            className="flex-1"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İndiriliyor...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                localStorage'a Aktar
              </>
            )}
          </Button>
        </div>

        {migrationComplete && (
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Migration Özet:</strong></p>
            <p>• Başarılı: {migrationStats.success}</p>
            <p>• Hata: {migrationStats.error}</p>
            <p>• Atlandı: {migrationStats.skipped}</p>
            <p>• Toplam: {migrationStats.total}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Not:</strong> Bu işlem birkaç dakika sürebilir.</p>
          <p>• Veriler localStorage'dan okunacak ve Supabase'e kopyalanacak</p>
          <p>• Duplicate kayıtlar Supabase'deki unique constraints ile önlenir</p>
          <p>• İşlem sırasında sayfa kapatılmamalı</p>
        </div>
      </CardContent>
    </Card>
  );
}