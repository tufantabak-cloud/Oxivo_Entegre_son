/**
 * Revenue Models Diagnostic Panel
 * 
 * Hesap Kalemleri, Sabit Komisyonlar ve Ek Gelirler için
 * versiyon geçmişi görüntüleme ve veri analiz paneli
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Database, 
  History, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';
import { 
  runFullDiagnostic, 
  extractVersionHistory,
  createSampleData,
  recoveryLegacyData,
  type RevenueModelsHistory
} from '../utils/revenueModelsRecovery';
import { HesapKalemi, SabitKomisyon, EkGelir } from './RevenueModelsTab';

interface RevenueModelsDiagnosticProps {
  hesapKalemleri: HesapKalemi[];
  sabitKomisyonlar: SabitKomisyon[];
  ekGelirler: EkGelir[];
  onLoadSampleData?: () => void;
  onRecoveryData?: (recovered: {
    hesapKalemleri: HesapKalemi[];
    sabitKomisyonlar: SabitKomisyon[];
    ekGelirler: EkGelir[];
  }) => void;
}

export function RevenueModelsDiagnostic({
  hesapKalemleri,
  sabitKomisyonlar,
  ekGelirler,
  onLoadSampleData,
  onRecoveryData
}: RevenueModelsDiagnosticProps) {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [history, setHistory] = useState<RevenueModelsHistory | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string>('');

  const handleRunDiagnostic = () => {
    setIsRunning(true);
    try {
      const result = runFullDiagnostic();
      setDiagnosticResult(result);
      setHistory(result.history);
      console.log('✅ Teşhis tamamlandı');
    } catch (error) {
      console.error('❌ Teşhis hatası:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExtractHistory = () => {
    const extracted = extractVersionHistory();
    setHistory(extracted);
    console.log('📜 Versiyon geçmişi çıkarıldı:', extracted);
  };

  const handleLoadSampleData = () => {
    if (onLoadSampleData) {
      onLoadSampleData();
    }
  };

  const handleRecoveryLegacyData = () => {
    setRecoveryMessage('');
    try {
      const result = recoveryLegacyData();
      setRecoveryMessage(result.message);
      
      if (result.success && onRecoveryData) {
        onRecoveryData(result.recovered);
        console.log('✅ Legacy veriler geri yüklendi:', result.recovered);
        
        // 🔄 Force page reload to ensure state sync
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Recovery hatası:', error);
      setRecoveryMessage('❌ Geri yükleme sırasında hata oluştu');
    }
  };
  
  const handleDebugLocalStorage = () => {
    console.log('=== 🔍 LOCALSTORAGE DEBUG ===');
    
    const keys = ['hesapKalemleri', 'sabitKomisyonlar', 'ekGelirler'];
    keys.forEach(key => {
      const raw = localStorage.getItem(key);
      console.log(`\n📦 ${key}:`);
      console.log('  Raw:', raw?.substring(0, 100) + '...');
      
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          console.log('  Has version:', 'version' in parsed);
          console.log('  Has data:', 'data' in parsed);
          console.log('  Version:', parsed.version);
          console.log('  Data type:', Array.isArray(parsed.data) ? 'Array' : typeof parsed.data);
          console.log('  Data length:', parsed.data?.length || 'N/A');
        } catch (e) {
          console.error('  Parse error:', e);
        }
      } else {
        console.log('  ❌ VERİ YOK');
      }
    });
    
    console.log('\n=== 🎯 CURRENT STATE ===');
    console.log('hesapKalemleri length:', hesapKalemleri.length);
    console.log('sabitKomisyonlar length:', sabitKomisyonlar.length);
    console.log('ekGelirler length:', ekGelirler.length);
    
    setRecoveryMessage('🔍 Debug bilgileri console\'a yazıldı (F12)');
  };

  // Hesap Kalemleri Özet
  const hesapKalemleriSummary = {
    total: hesapKalemleri.length,
    active: hesapKalemleri.filter(h => h.aktif).length,
    inactive: hesapKalemleri.filter(h => !h.aktif).length
  };

  // Sabit Komisyonlar Özet
  const sabitKomisyonlarSummary = {
    total: sabitKomisyonlar.length,
    active: sabitKomisyonlar.filter(sk => sk.aktif).length,
    inactive: sabitKomisyonlar.filter(sk => !sk.aktif).length
  };

  // Ek Gelirler Özet
  const ekGelirlerSummary = {
    total: ekGelirler.length,
    active: ekGelirler.filter(eg => eg.aktif).length,
    inactive: ekGelirler.filter(eg => !eg.aktif).length
  };

  return (
    <div className="space-y-4">
      {/* Kontrol Paneli */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Gelir Modelleri Teşhis Paneli
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleRunDiagnostic}
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Search size={16} className="mr-2" />
              )}
              Tam Teşhis Çalıştır
            </Button>
            
            <Button 
              onClick={handleExtractHistory}
              variant="outline"
              size="sm"
            >
              <History size={16} className="mr-2" />
              Versiyon Geçmişi
            </Button>
            
            <Button 
              onClick={handleRecoveryLegacyData}
              variant="outline"
              size="sm"
              className="bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
            >
              <Download size={16} className="mr-2" />
              Legacy Verileri Geri Yükle
            </Button>
            
            <Button 
              onClick={handleDebugLocalStorage}
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-300 hover:bg-blue-100"
            >
              <AlertTriangle size={16} className="mr-2" />
              Debug localStorage
            </Button>
            
            <Button 
              onClick={handleLoadSampleData}
              variant="outline"
              size="sm"
            >
              <Database size={16} className="mr-2" />
              Örnek Veri Yükle
            </Button>
          </div>

          {recoveryMessage && (
            <Alert className={recoveryMessage.startsWith('✅') ? 'bg-green-50' : 'bg-yellow-50'}>
              <AlertDescription>
                {recoveryMessage}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info size={16} />
            <AlertDescription>
              <strong>Teşhis Paneli:</strong> Bu panel localStorage'da saklanan gelir modelleri verilerinin 
              versiyon geçmişini ve içeriğini kontrol eder. Browser console'da detaylı logları görebilirsiniz.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Anlık Durum Özeti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Anlık Veri Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hesap Kalemleri */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-70">Hesap Kalemleri</span>
                <FileText size={16} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Toplam:</span>
                  <Badge variant="outline">{hesapKalemleriSummary.total}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Aktif:</span>
                  <Badge variant="default">{hesapKalemleriSummary.active}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pasif:</span>
                  <Badge variant="secondary">{hesapKalemleriSummary.inactive}</Badge>
                </div>
              </div>
            </div>

            {/* Sabit Komisyonlar */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-70">Sabit Komisyonlar</span>
                <TrendingUp size={16} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Toplam:</span>
                  <Badge variant="outline">{sabitKomisyonlarSummary.total}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Aktif:</span>
                  <Badge variant="default">{sabitKomisyonlarSummary.active}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pasif:</span>
                  <Badge variant="secondary">{sabitKomisyonlarSummary.inactive}</Badge>
                </div>
              </div>
            </div>

            {/* Ek Gelirler */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-70">Ek Gelirler</span>
                <Database size={16} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Toplam:</span>
                  <Badge variant="outline">{ekGelirlerSummary.total}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Aktif:</span>
                  <Badge variant="default">{ekGelirlerSummary.active}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pasif:</span>
                  <Badge variant="secondary">{ekGelirlerSummary.inactive}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Versiyon Geçmişi */}
      {history && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={20} />
              Versiyon Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hesap Kalemleri Geçmişi */}
            {history.hesapKalemleri.length > 0 && (
              <div>
                <h4 className="mb-2">📊 Hesap Kalemleri</h4>
                <div className="space-y-2">
                  {history.hesapKalemleri.map((snapshot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={snapshot.version === 'legacy' ? 'secondary' : 'default'}>
                          v{snapshot.version}
                        </Badge>
                        <span className="text-sm">{snapshot.size} kayıt</span>
                      </div>
                      <span className="text-xs opacity-70">{snapshot.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sabit Komisyonlar Geçmişi */}
            {history.sabitKomisyonlar.length > 0 && (
              <div>
                <h4 className="mb-2">💰 Sabit Komisyonlar</h4>
                <div className="space-y-2">
                  {history.sabitKomisyonlar.map((snapshot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={snapshot.version === 'legacy' ? 'secondary' : 'default'}>
                          v{snapshot.version}
                        </Badge>
                        <span className="text-sm">{snapshot.size} kayıt</span>
                      </div>
                      <span className="text-xs opacity-70">{snapshot.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ek Gelirler Geçmişi */}
            {history.ekGelirler.length > 0 && (
              <div>
                <h4 className="mb-2">💵 Ek Gelirler</h4>
                <div className="space-y-2">
                  {history.ekGelirler.map((snapshot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={snapshot.version === 'legacy' ? 'secondary' : 'default'}>
                          v{snapshot.version}
                        </Badge>
                        <span className="text-sm">{snapshot.size} kayıt</span>
                      </div>
                      <span className="text-xs opacity-70">{snapshot.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.hesapKalemleri.length === 0 && 
             history.sabitKomisyonlar.length === 0 && 
             history.ekGelirler.length === 0 && (
              <Alert>
                <AlertTriangle size={16} />
                <AlertDescription>
                  Hiçbir versiyon geçmişi bulunamadı. localStorage'da veri yok.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teşhis Sonuçları */}
      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Teşhis Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info size={16} />
              <AlertDescription>
                Teşhis tamamlandı. Detaylı sonuçlar için browser console'u kontrol edin (F12).
                Console'da aşağıdaki komutları kullanabilirsiniz:
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  console.table(diagnosticResult.hesapKalemleri?.items);
                  console.table(diagnosticResult.sabitKomisyonlar?.items);
                  console.table(diagnosticResult.ekGelirler?.items);
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
