// Müşteri Domain Eşleştirme Debug Aracı
// Belirli bir müşteriyi cari kodu ile arayıp domain-ürün eşleştirmesini analiz eder

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Customer } from './CustomerModule';
import type { PayterProduct } from './PayterProductTab';
import { matchDomain, normalizeDomain, collectAllDomainsFromHierarchy } from '../utils/domainMatching';

interface CustomerDomainDebuggerProps {
  customers: Customer[];
  payterProducts: PayterProduct[];
}

export function CustomerDomainDebugger({ customers, payterProducts }: CustomerDomainDebuggerProps) {
  const [searchTerm, setSearchTerm] = useState('120.01.007');
  const [debugResult, setDebugResult] = useState<any>(null);

  const analyzeCustomer = () => {
    // Debug: Tüm müşterilerin cari kodlarını logla
    console.log('🔍 Arama yapılıyor:', searchTerm);
    console.log('📊 Toplam müşteri sayısı:', customers.length);
    
    // Arama terimini temizle
    const cleanSearchTerm = searchTerm.trim();
    
    // Debug: İlk 5 müşterinin cari kodlarını göster
    console.log('📝 İlk 5 müşteri cari kodu:', 
      customers.slice(0, 5).map(c => ({ kod: c.cariKodu, ad: c.cariAdi }))
    );
    
    // Müşteri ara (trim edilmiş değerlerle)
    const customer = customers.find(c => {
      const cariKodu = c.cariKodu?.trim() || '';
      const cariAdi = c.cariAdi?.trim().toLowerCase() || '';
      const searchLower = cleanSearchTerm.toLowerCase();
      
      // Debug: Her müşteriyi kontrol ederken logla (sadece arama terimiyle başlayanlar)
      if (cariKodu.includes(cleanSearchTerm) || cariAdi.includes(searchLower)) {
        console.log('✅ Eşleşme bulundu:', { kod: cariKodu, ad: c.cariAdi });
      }
      
      return cariKodu.includes(cleanSearchTerm) || cariAdi.includes(searchLower);
    });

    if (!customer) {
      console.log('❌ Hiçbir müşteri bulunamadı!');
      console.log('💡 İpucu: Cari kodu tam olarak şöyle arayın:', 
        customers.filter(c => c.cariKodu?.includes('120.01')).map(c => c.cariKodu)
      );
      setDebugResult({ 
        error: `${cleanSearchTerm} Müşteri bulunamadı! Toplam ${customers.length} müşteri arasında arama yapıldı. Konsola bakın.` 
      });
      return;
    }
    
    console.log('✅ Müşteri bulundu:', customer.cariKodu, '-', customer.cariAdi);

    // Müşteri temel bilgileri
    const customerDomain = customer.domain || customer.guncelMyPayterDomain;
    const ignoreMainDomain = customer.ignoreMainDomain || false;
    const ignoreNote = customer.ignoreMainDomainNote || '';
    
    // Cihaz bilgileri
    const devices = customer.serviceFeeSettings?.deviceSubscriptions?.filter(d => d.isActive) || [];
    const deviceSerials = devices.map(d => d.deviceSerialNumber).filter(Boolean);
    
    // Domain hiyerarşisi
    const allDomains = collectAllDomainsFromHierarchy(customerDomain, customer.domainHierarchy);
    
    // Ürün eşleştirme analizi
    const matchedProducts: any[] = [];
    const unmatchedProducts: any[] = [];
    
    payterProducts.forEach(product => {
      // Serial number kontrolü
      const hasSerial = deviceSerials.includes(product.serialNumber);
      
      // Domain kontrolü
      const domainMatch = product.domain && customerDomain 
        ? matchDomain(product.domain, customerDomain, ignoreMainDomain, customer.domainHierarchy)
        : false;
      
      // Serial number eşleşmesi varsa
      if (hasSerial) {
        const analysis = {
          serialNumber: product.serialNumber,
          productDomain: product.domain,
          normalizedProductDomain: normalizeDomain(product.domain),
          onlineStatus: product.onlineStatus,
          domainMatch,
          matchReason: getDomainMatchReason(
            product.domain,
            customerDomain,
            ignoreMainDomain,
            customer.domainHierarchy,
            allDomains
          )
        };
        
        if (domainMatch) {
          matchedProducts.push(analysis);
        } else {
          unmatchedProducts.push(analysis);
        }
      }
    });

    setDebugResult({
      customer: {
        cariKodu: customer.cariKodu,
        cariAdi: customer.cariAdi,
        domain: customerDomain,
        normalizedDomain: normalizeDomain(customerDomain),
        ignoreMainDomain,
        ignoreMainDomainNote: ignoreNote,
      },
      devices: {
        count: devices.length,
        serials: deviceSerials,
      },
      domains: {
        mainDomain: customerDomain,
        allDomains,
        hierarchyCount: customer.domainHierarchy?.length || 0,
      },
      products: {
        matched: matchedProducts,
        unmatched: unmatchedProducts,
        total: matchedProducts.length + unmatchedProducts.length,
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-orange-600" size={20} />
          Müşteri Domain Eşleştirme Debug
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Arama */}
          <div className="flex gap-2">
            <Input
              placeholder="Cari Kodu veya Müşteri Adı (örn: 120.01.007)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeCustomer()}
            />
            <Button onClick={analyzeCustomer}>
              <Search size={16} className="mr-2" />
              Analiz Et
            </Button>
          </div>

          {/* Sonuçlar */}
          {debugResult && (
            <div className="space-y-4">
              {debugResult.error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle size={20} />
                    <strong>Hata:</strong>
                  </div>
                  <p>{debugResult.error}</p>
                  <p className="text-sm mt-2">
                    💡 <strong>İpucu:</strong> Tam cari kodu veya müşteri adının bir kısmını yazın. 
                    Konsol'u (F12) açarak arama detaylarını görebilirsiniz.
                  </p>
                </div>
              ) : (
                <>
                  {/* Müşteri Bilgileri */}
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-blue-900">Müşteri Bilgileri</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Cari Kodu:</strong> {debugResult.customer.cariKodu}</p>
                      <p><strong>Cari Adı:</strong> {debugResult.customer.cariAdi}</p>
                      <p><strong>Domain:</strong> {debugResult.customer.domain || 'YOK'}</p>
                      <p><strong>Normalized Domain:</strong> {debugResult.customer.normalizedDomain || 'YOK'}</p>
                      <p className="flex items-center gap-2">
                        <strong>Ana Domain Görmezden Gel:</strong>
                        {debugResult.customer.ignoreMainDomain ? (
                          <Badge className="bg-orange-600">AÇIK</Badge>
                        ) : (
                          <Badge variant="secondary">KAPALI</Badge>
                        )}
                      </p>
                      {debugResult.customer.ignoreMainDomainNote && (
                        <p className="text-xs italic text-gray-600">
                          Not: {debugResult.customer.ignoreMainDomainNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Domain Bilgileri */}
                  <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-purple-900">Domain Yapısı</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Ana Domain:</strong> {debugResult.domains.mainDomain || 'YOK'}</p>
                      <p><strong>Hiyerarşideki Domain Sayısı:</strong> {debugResult.domains.hierarchyCount}</p>
                      <p><strong>Toplam Domain Listesi:</strong></p>
                      <ul className="list-disc list-inside pl-4">
                        {debugResult.domains.allDomains.map((d: string, i: number) => (
                          <li key={i} className="text-xs">{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cihaz Bilgileri */}
                  <div className="p-4 bg-indigo-50 rounded-lg space-y-2">
                    <h4 className="font-semibold text-indigo-900">Cihaz Bilgileri</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Aktif Cihaz Sayısı:</strong> {debugResult.devices.count}</p>
                      <p><strong>Serial Number Listesi:</strong></p>
                      <ul className="list-disc list-inside pl-4">
                        {debugResult.devices.serials.map((s: string, i: number) => (
                          <li key={i} className="text-xs">{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Eşleşen Ürünler */}
                  {debugResult.products.matched.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg space-y-2">
                      <h4 className="font-semibold text-green-900 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Eşleşen Ürünler ({debugResult.products.matched.length})
                      </h4>
                      <div className="space-y-2">
                        {debugResult.products.matched.map((p: any, i: number) => (
                          <div key={i} className="p-3 bg-white rounded border border-green-200 text-sm">
                            <p><strong>Serial:</strong> {p.serialNumber}</p>
                            <p><strong>Domain:</strong> {p.productDomain}</p>
                            <p><strong>Normalized:</strong> {p.normalizedProductDomain}</p>
                            <p><strong>Online Status:</strong> {p.onlineStatus}</p>
                            <p className="text-xs text-green-700 mt-1">
                              ✅ {p.matchReason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eşleşmeyen Ürünler */}
                  {debugResult.products.unmatched.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg space-y-2">
                      <h4 className="font-semibold text-red-900 flex items-center gap-2">
                        <XCircle size={16} />
                        Eşleşmeyen Ürünler ({debugResult.products.unmatched.length})
                      </h4>
                      <div className="space-y-2">
                        {debugResult.products.unmatched.map((p: any, i: number) => (
                          <div key={i} className="p-3 bg-white rounded border border-red-200 text-sm">
                            <p><strong>Serial:</strong> {p.serialNumber}</p>
                            <p><strong>Domain:</strong> {p.productDomain || 'YOK'}</p>
                            <p><strong>Normalized:</strong> {p.normalizedProductDomain || 'YOK'}</p>
                            <p><strong>Online Status:</strong> {p.onlineStatus}</p>
                            <p className="text-xs text-red-700 mt-1">
                              ❌ {p.matchReason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Özet */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Özet</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {debugResult.products.total}
                        </div>
                        <div className="text-xs text-gray-600">Toplam Ürün</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {debugResult.products.matched.length}
                        </div>
                        <div className="text-xs text-gray-600">Eşleşen</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {debugResult.products.unmatched.length}
                        </div>
                        <div className="text-xs text-gray-600">Eşleşmeyen</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Domain eşleştirme mantığını açıklayan yardımcı fonksiyon
function getDomainMatchReason(
  productDomain: string | undefined,
  customerDomain: string | undefined,
  ignoreMainDomain: boolean,
  domainHierarchy: any[] | undefined,
  allDomains: string[]
): string {
  const normalizedProduct = normalizeDomain(productDomain);
  const normalizedCustomer = normalizeDomain(customerDomain);

  if (!normalizedProduct) {
    return 'Ürün domain bilgisi yok';
  }

  if (!normalizedCustomer) {
    return 'Müşteri domain bilgisi yok';
  }

  if (ignoreMainDomain) {
    // Ana domain eşleşmesi engellendi mi?
    if (normalizedProduct === normalizedCustomer) {
      return `Ana domain görmezden gelme AÇIK, ama ürün domain'i (${normalizedProduct}) ana domain ile TAM eşleşiyor - EŞLEŞMEDİ`;
    }

    // Alt domain formatı (.subdomain.maindomain)
    if (normalizedProduct.endsWith('.' + normalizedCustomer)) {
      return `Alt domain formatı tespit edildi (${normalizedProduct}) - EŞLEŞTİ`;
    }

    // Domain hiyerarşisinde var mı?
    if (allDomains.includes(normalizedProduct)) {
      return `Domain hiyerarşisinde tanımlı (${normalizedProduct}) - EŞLEŞTİ`;
    }

    return `Ana domain görmezden gelme AÇIK, ancak ürün domain'i (${normalizedProduct}) ne alt domain formatında ne de hiyerarşide yok - EŞLEŞMEDİ`;
  } else {
    // Normal mod: tam eşleşme gerekli
    if (normalizedProduct === normalizedCustomer) {
      return `Tam domain eşleşmesi (${normalizedProduct} = ${normalizedCustomer}) - EŞLEŞTİ`;
    }

    return `Tam eşleşme yok (${normalizedProduct} ≠ ${normalizedCustomer}) - EŞLEŞMEDİ`;
  }
}
