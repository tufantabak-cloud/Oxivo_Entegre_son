// Tüm Müşterilerin Cihaz Adedi Analizi
// Domain bazlı otomatik eşleştirme analizi

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { matchDomain } from '../utils/domainMatching';
import type { Customer } from './CustomerModule';
import type { PayterProduct } from './PayterProductTab';
import type { DomainNode } from './CustomerDetail';

interface DeviceCountAnalyzerProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

interface AnalysisResult {
  cariKodu: string;
  cariAdi: string;
  guncelDomain: string;
  allDomains: string[];
  domainMatchCount: number;
  ignoreMainDomain: boolean;
  status: 'ok' | 'warning' | 'critical';
  sampleDevices: Array<{
    serialNumber: string;
    domain: string;
    terminalModel: string;
  }>;
}

export function DeviceCountAnalyzer({ customers, payterProducts }: DeviceCountAnalyzerProps) {
  const analysisResults = useMemo(() => {
    const results: AnalysisResult[] = [];

    customers.forEach(customer => {
      const customerDomain = customer.guncelMyPayterDomain || customer.domain;
      
      // Müşterinin tüm domain'lerini topla (debug için)
      const allDomains: string[] = [];
      
      if (customer.guncelMyPayterDomain && customer.guncelMyPayterDomain.trim()) {
        allDomains.push(customer.guncelMyPayterDomain.trim().toLowerCase());
      }
      
      const collectFromHierarchy = (nodes: DomainNode[]) => {
        nodes?.forEach(node => {
          if (node.name && node.name.trim()) {
            allDomains.push(node.name.trim().toLowerCase());
          }
          if (node.children && node.children.length > 0) {
            collectFromHierarchy(node.children);
          }
        });
      };
      
      if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
        collectFromHierarchy(customer.domainHierarchy);
      }

      // Domain bazlı eşleşme sayısı (matchDomain utility kullanarak - ignoreMainDomain desteği ile)
      const matchedDevices = payterProducts.filter(product => {
        if (!product.domain || !product.domain.trim() || !customerDomain) {
          return false;
        }
        
        return matchDomain(
          product.domain,
          customerDomain,
          customer.ignoreMainDomain || false,
          customer.domainHierarchy
        );
      });

      const domainMatchCount = matchedDevices.length;

      // Status belirleme
      let status: 'ok' | 'warning' | 'critical' = 'ok';
      if (customerDomain && customerDomain.trim() && domainMatchCount === 0) {
        status = 'warning'; // Domain var ama eşleşme yok
      } else if (!customerDomain || !customerDomain.trim()) {
        status = 'critical'; // Domain bilgisi yok
      }

      // Sadece cihazı olan veya sorunlu müşterileri kaydet
      if (domainMatchCount > 0 || status !== 'ok') {
        results.push({
          cariKodu: customer.cariKodu || '',
          cariAdi: customer.cariAdi || '',
          guncelDomain: customer.guncelMyPayterDomain || '',
          allDomains,
          domainMatchCount,
          ignoreMainDomain: customer.ignoreMainDomain || false,
          status,
          sampleDevices: matchedDevices.slice(0, 3).map(d => ({
            serialNumber: d.serialNumber || '',
            domain: d.domain || '',
            terminalModel: d.terminalModel || ''
          }))
        });
      }
    });

    // Önce critical, sonra warning, sonra ok sıralama
    return results.sort((a, b) => {
      const statusOrder = { critical: 0, warning: 1, ok: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [customers, payterProducts]);

  const summary = useMemo(() => {
    const critical = analysisResults.filter(r => r.status === 'critical').length;
    const warning = analysisResults.filter(r => r.status === 'warning').length;
    const ok = analysisResults.filter(r => r.status === 'ok').length;
    
    return { critical, warning, ok, total: analysisResults.length };
  }, [analysisResults]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-orange-600" size={20} />
          Cihaz Adedi Analizi (Domain Eşleştirme)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Özet */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-xs text-gray-600">Toplam Müşteri</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
              <div className="text-xs text-gray-600">Kritik Sorun</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.warning}</div>
              <div className="text-xs text-gray-600">Uyarı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.ok}</div>
              <div className="text-xs text-gray-600">Sorunsuz</div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-3 bg-blue-50 rounded text-sm space-y-1">
            <p className="flex items-center gap-2">
              <Badge className="bg-red-600">KRİTİK</Badge>
              Domain bilgisi eksik veya yanlış
            </p>
            <p className="flex items-center gap-2">
              <Badge className="bg-orange-600">UYARI</Badge>
              Domain var ama eşleşen cihaz bulunamadı
            </p>
            <p className="flex items-center gap-2">
              <Badge className="bg-green-600">SORUNSUZ</Badge>
              Domain eşleşmesi başarılı
            </p>
          </div>

          {/* Sonuçlar */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {analysisResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border ${
                  result.status === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : result.status === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {result.status === 'critical' ? (
                        <AlertTriangle size={16} className="text-red-600" />
                      ) : result.status === 'warning' ? (
                        <Info size={16} className="text-orange-600" />
                      ) : (
                        <CheckCircle size={16} className="text-green-600" />
                      )}
                      <span className="font-semibold">{result.cariAdi}</span>
                    </div>
                    <p className="text-xs text-gray-600 ml-6">{result.cariKodu}</p>
                  </div>
                  <Badge
                    className={
                      result.status === 'critical'
                        ? 'bg-red-600'
                        : result.status === 'warning'
                        ? 'bg-orange-600'
                        : 'bg-green-600'
                    }
                  >
                    {result.status === 'critical'
                      ? 'KRİTİK'
                      : result.status === 'warning'
                      ? 'UYARI'
                      : 'OK'}
                  </Badge>
                </div>

                <div className="ml-6 space-y-1 text-sm">
                  <p>
                    <strong>Ana Domain:</strong> {result.guncelDomain || '❌ YOK'}
                  </p>
                  <p>
                    <strong>Tüm Domain'ler ({result.allDomains.length}):</strong>{' '}
                    {result.allDomains.length > 0 ? (
                      <span className="text-xs font-mono">
                        {result.allDomains.join(', ')}
                      </span>
                    ) : (
                      <span className="text-red-600">❌ Hiç domain tanımlı değil!</span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-4 p-2 bg-white rounded mt-2">
                    <div>
                      <div className="text-xs text-gray-600">Cihaz Adedi</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {result.domainMatchCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">ignoreMainDomain</div>
                      <div className="text-xl font-bold text-orange-600">
                        {result.ignoreMainDomain ? '✓ Aktif' : '○ Kapalı'}
                      </div>
                    </div>
                  </div>

                  {/* Örnek Cihazlar */}
                  {result.sampleDevices.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600 hover:underline">
                        Örnek cihazlar ({result.sampleDevices.length}/{result.domainMatchCount})
                      </summary>
                      <ul className="mt-1 ml-4 space-y-1">
                        {result.sampleDevices.map((device, i) => (
                          <li key={i} className="text-xs font-mono bg-white p-1 rounded">
                            {device.serialNumber} | {device.domain} | {device.terminalModel}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Sorun Açıklaması */}
                  {result.status === 'critical' && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                      <strong>❌ SORUN:</strong> Bu müşteri için domain bilgisi eksik veya yanlış! 
                      Lütfen "Güncel Mypayter Domain" ve "Domain Hiyerarşisi" bilgilerini kontrol edin.
                    </div>
                  )}
                  {result.status === 'warning' && (
                    <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                      <strong>⚠️ UYARI:</strong> Domain bilgisi var ({result.guncelDomain}) ama 
                      hiç cihaz eşleşmesi bulunamadı. Domain bilgisini veya PayterProducts 
                      listesini kontrol edin.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
